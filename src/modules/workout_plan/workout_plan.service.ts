import { Request } from "express";
import axios from "axios";
import httpStatus from "http-status";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import ApiError from "../../errors/ApiError";
import { WorkoutPlanModel } from "./workout_plan.model";
import { GeneratedWorkoutPlanModel } from "./generated_workout.model";
import { HealthDetailsModel } from "../health_details/health_details.model";
import { workoutQueue } from "../../queues/workout.queues";

// Map the stored goal enum ("lose" | "gain" | "stay-fit") to the
// human-readable main_goal value the AI server expects.
const mapMainGoal = (goal?: string): string => {
  const map: Record<string, string> = {
    lose: "Lose Weight",
    "lose weight": "Lose Weight",
    gain: "Gain Weight",
    "gain muscle": "Gain Muscle",
    "stay-fit": "Stay Fit",
    "stay fit": "Stay Fit",
    maintain: "Stay Fit",
  };
  return map[goal?.toLowerCase() || ""] || "Stay Fit";
};

// Normalize a truthy/falsy flag coming from query string or JSON body.
const toBool = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

// The AI returns relative video paths (e.g. "/workout/api/exercise_video/..").
// Turn every exercise video_url into an absolute URL using AI_SERVER_BASE.
const absolutizeVideoUrls = (weekly: any[]): any[] => {
  const base = (process.env.AI_SERVER_BASE || "").replace(/\/+$/, "");

  const fix = (exercises: any[] = []) =>
    exercises.map((ex) => ({
      ...ex,
      video_url:
        ex?.video_url && ex.video_url.startsWith("/")
          ? `${base}${ex.video_url}`
          : ex?.video_url,
    }));

  return (weekly || []).map((day) => ({
    ...day,
    warmup_exercises: fix(day.warmup_exercises),
    main_exercises: fix(day.main_exercises),
    cooldown_exercises: fix(day.cooldown_exercises),
  }));
};

/**
 * Generate a weekly workout plan by calling the external AI server.
 *
 * The static health metrics (blood type, age, weight, height, main goal and
 * desired weight) are pulled from the user's stored health details. The
 * UI-driven selections that are NOT persisted in our database (body shape,
 * activity level, workout level, focus areas, language and whether to generate
 * videos) are taken from the request — query string or body — with sensible
 * defaults so the endpoint also works with no extra input.
 */
export const generateWorkoutPlanService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  const health = await HealthDetailsModel.findOne({ userId }).lean();
  if (!health) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Health details not found for this user. Please complete your profile first.",
    );
  }

  const { bloodGroup, age, weight, height, goal, desiredWeight } = health;

  if (!bloodGroup || !age || !weight || !height) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Incomplete health details. Blood type, age, weight and height are required.",
    );
  }

  // UI selections: accept from body first, then query, otherwise default.
  const input = { ...(req.query as any), ...(req.body as any) };

  const bodyShape = input.body_shape || "Medium";
  const activityLevel = input.activity_level || "Sedentary";
  const workoutLevel = input.workout_level || "Break A Light Sweat";
  const focusAreas = input.focus_areas || "Full Body";
  const language = input.language || "en";
  const generateVideos = toBool(input.generate_videos, true);

  // When true the user explicitly wants a brand-new plan even though the
  // current 7-day plan has not expired yet.
  const regenerate = toBool(input.regenerate, false);

  const now = new Date();

  // Is there an active plan whose 7-day window is still running?
  const activePlan = await GeneratedWorkoutPlanModel.findOne({
    userId,
    isActive: true,
    weekEndDate: { $gt: now },
  }).lean();

  // Active plan still valid and the user did NOT force a regenerate:
  // return the existing plan instead of queueing a new AI generation.
  if (activePlan && !regenerate) {
    return {
      alreadyActive: true,
      status: "active",
      message:
        "You already have an active workout plan for this week. Send regenerate=true to create a new one.",
      plan: activePlan,
    };
  }

  // The AI params the worker will send to the AI server. Health-derived values
  // are resolved here so the worker stays a thin processor.
  const aiParams = {
    user_id: userId,
    blood_type: bloodGroup,
    age,
    weight,
    height,
    body_shape: bodyShape,
    activity_level: activityLevel,
    workout_level: workoutLevel,
    main_goal: mapMainGoal(goal),
    desired_weight: desiredWeight,
    focus_areas: focusAreas,
    generate_videos: generateVideos,
    language,
  };

  // Guard against duplicate concurrent generations: if this user already has a
  // workout job in flight (queued, running or delayed), don't enqueue another —
  // return the existing job. This guarantees exactly ONE generation result is
  // saved per request burst (no racing jobs, no duplicate active plans).
  const inFlight = await workoutQueue.getJobs(["waiting", "active", "delayed"]);
  const existingJob = inFlight.find((j) => j?.data?.userId === userId);

  if (existingJob) {
    return {
      jobId: existingJob.id,
      status: "processing",
      message: "A workout plan is already being generated. Please wait.",
    };
  }

  // Offload the slow AI call to the queue (worker emits "workout-generated"
  // over the socket when finished, mirroring the meal-generation flow).
  const job = await workoutQueue.add("generate-workout", { userId, aiParams });

  return {
    jobId: job.id,
    status: "processing",
  };
};

/**
 * Worker-side processor: calls the AI server, archives the user's previous
 * active plan, and stores the new plan (history mode). Returns the saved doc,
 * which becomes the BullMQ job return value.
 */
export const processWorkoutGeneration = async (data: {
  userId: string;
  aiParams: Record<string, any>;
}) => {
  const { userId, aiParams } = data;

  const response = await axios.get(
    `${process.env.AI_SERVER_BASE}/workout/weekly_workout_plan_ui`,
    {
      params: aiParams,
      timeout: 520000, // AI generation can take a while
    },
  );

  const plan = response.data;

  // Archive any previously active plans — kept as history, no longer current.
  await GeneratedWorkoutPlanModel.updateMany(
    { userId, isActive: true },
    { $set: { isActive: false } },
  );

  const weekStartDate = new Date();
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  // Insert a NEW plan document (history mode — never overwrites old weeks).
  const saved = await GeneratedWorkoutPlanModel.create({
    userId,
    aiUserId: plan.user_id,
    blood_type: plan.blood_type,
    age: plan.age,
    bmi: plan.bmi,
    bmi_category: plan.bmi_category,
    body_shape: plan.body_shape,
    activity_level: plan.activity_level,
    main_goal: plan.main_goal,
    workout_level: plan.workout_level,
    focus_areas: plan.focus_areas,
    plan_summary: plan.plan_summary,
    weekly_workouts: absolutizeVideoUrls(plan.weekly_workouts),
    videos_generated: plan.videos_generated,
    videos_cached: plan.videos_cached,
    weekStartDate,
    weekEndDate,
    isActive: true,
  });

  return saved;
};

// export const createWorkoutService = async (data: Request) => {
//   const { workouts, workoutDate } = data.body;
//   const user = data.user as JwtPayloadWithUser;
//   const userId = user.id;

//   if (!Array.isArray(workouts) || workouts.length === 0) {
//     throw new ApiError(400, "Workouts array is required");
//   }

//   if (!workoutDate) {
//     throw new ApiError(400, "Workout Date is required");
//   }

//   const workoutDocs = workouts.map((workout) => ({
//     userId,
//     workoutName: workout.workoutName,
//     duration: workout.duration,
//     image: workout.image,
//     focusArea: workout.focusArea,

//     focusAreaImage: workout.focusAreaImage,
//     workoutDate: new Date(workoutDate),
//     status: "not_yet_done",
//   }));

//   const savedWorkouts = await WorkoutPlanModel.insertMany(workoutDocs);

//   return savedWorkouts;
// };

export const createWorkoutService = async (req: Request) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const { workoutDate } = req.body;

    let workouts;
    try {
      workouts = JSON.parse(req.body.workouts);
    } catch (error) {
      throw new ApiError(400, "Workouts must be a valid JSON array");
    }

    if (!Array.isArray(workouts) || workouts.length === 0) {
      throw new ApiError(400, "Workouts array is required");
    }

    if (!workoutDate) {
      throw new ApiError(400, "Workout Date is required");
    }

    const files = req.files as Express.Multer.File[];

    // helper to normalize windows paths
    const normalizePath = (path: string) =>
      path.replace(/\\/g, "/").replace("public", "");

    // helper to find uploaded image
    const getFilePath = (fieldName: string) => {
      const file = files?.find((f) => f.fieldname === fieldName);
      return file ? normalizePath(file.path) : null;
    };

    const workoutDocs = workouts.map((workout, index) => {
      if (!workout.workoutName || !workout.duration || !workout.focusArea) {
        throw new ApiError(
          400,
          `Workout at index ${index} is missing required fields`,
        );
      }

      return {
        userId,
        workoutName: workout.workoutName,
        duration: workout.duration,
        image: getFilePath(`workoutImage_${index}`),
        focusArea: workout.focusArea,
        focusAreaImage: getFilePath(`focusAreaImage_${index}`),
        workoutDate: new Date(workoutDate),
        status: "not_yet_done",
      };
    });

    const savedWorkouts = await WorkoutPlanModel.insertMany(workoutDocs);

    return savedWorkouts;
  } catch (err) {
    console.log(err);
  }
};
// Fetch the user's current (active) generated weekly workout plan.
export const getGeneratedWorkoutPlanService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;

  const plan = await GeneratedWorkoutPlanModel.findOne({
    userId: user.id,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!plan) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No active workout plan found. Generate one first.",
    );
  }

  return plan;
};

// Fetch the user's past + current generated plans (newest first).
export const getWorkoutPlanHistoryService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;

  const history = await GeneratedWorkoutPlanModel.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .lean();

  return history;
};

// Check whether the user already has an active workout plan whose 7-day
// window is still running. Used by the frontend to decide between "generate"
// and "view current plan".
export const checkActiveWorkoutPlanService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;

  const now = new Date();

  const activePlan = await GeneratedWorkoutPlanModel.findOne({
    userId: user.id,
    isActive: true,
    weekEndDate: { $gt: now },
  }).lean();

  if (!activePlan) {
    return {
      hasActivePlan: false,
      plan: null,
    };
  }

  return {
    hasActivePlan: true,
    weekStartDate: activePlan.weekStartDate,
    weekEndDate: activePlan.weekEndDate,
    planId: activePlan._id,
    plan: activePlan,
  };
};

// Mark a single day within the generated plan as done / not_yet_done.
export const updateGeneratedDayStatusService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const { dayId } = req.params;
  const status = req.body?.status === "not_yet_done" ? "not_yet_done" : "done";

  const updated = await GeneratedWorkoutPlanModel.findOneAndUpdate(
    { userId: user.id, "weekly_workouts._id": dayId },
    { $set: { "weekly_workouts.$.status": status } },
    { new: true },
  ).lean();

  if (!updated) {
    throw new ApiError(httpStatus.NOT_FOUND, "Workout day not found");
  }

  return updated;
};

export const updateWorkoutStatusService = async (data: Request) => {
  try {
    const { workoutPlanId } = data.params;

    const checkWorkoutPlan = await WorkoutPlanModel.findOne({
      _id: workoutPlanId,
    });

    // check if workout plan doesnt exist .
    if (!checkWorkoutPlan) {
      throw new ApiError(400, "Workout plan not found");
    } else if (checkWorkoutPlan.status === "done") {
      throw new ApiError(400, "This workout plan is already done");
    }

    const updateWorkoutStatus = await WorkoutPlanModel.updateOne(
      { _id: workoutPlanId },
      { status: "done" },
    );

    return updateWorkoutStatus;
  } catch (err) {
    console.log(err);
  }
};

export const deleteWorkoutPlanService = async (data: Request) => {
  try {
    const { workoutPlanId } = data.params;
    const deleteWorkoutPlan = await WorkoutPlanModel.deleteOne({
      _id: workoutPlanId,
    });

    return deleteWorkoutPlan;
  } catch (err) {
    console.log(err);
  }
};
