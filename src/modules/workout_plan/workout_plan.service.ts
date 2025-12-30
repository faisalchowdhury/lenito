import { Request } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import ApiError from "../../errors/ApiError";
import { WorkoutPlanModel } from "./workout_plan.model";

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
        `Workout at index ${index} is missing required fields`
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
};
export const updateWorkoutStatusService = async (data: Request) => {
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
    { status: "done" }
  );

  return updateWorkoutStatus;
};

export const deleteWorkoutPlanService = async (data: Request) => {
  const { workoutPlanId } = data.params;
  const deleteWorkoutPlan = await WorkoutPlanModel.deleteOne({
    _id: workoutPlanId,
  });

  return deleteWorkoutPlan;
};
