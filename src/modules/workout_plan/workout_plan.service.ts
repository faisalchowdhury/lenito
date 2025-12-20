import { Request } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import ApiError from "../../errors/ApiError";
import { WorkoutPlanModel } from "./workout_plan.model";

export const createWorkoutService = async (data: Request) => {
  const { workouts, workoutDate } = data.body;
  const user = data.user as JwtPayloadWithUser;
  const userId = user.id;

  if (!Array.isArray(workouts) || workouts.length === 0) {
    throw new ApiError(400, "Workouts array is required");
  }

  if (!workoutDate) {
    throw new ApiError(400, "Workout Date is required");
  }

  const workoutDocs = workouts.map((workout) => ({
    userId,
    workoutName: workout.workoutName,
    duration: workout.duration,
    image: workout.image,
    focusArea: workout.focusArea,

    focusAreaImage: workout.focusAreaImage,
    workoutDate: new Date(workoutDate),
    status: "not_yet_done",
  }));

  const savedWorkouts = await WorkoutPlanModel.insertMany(workoutDocs);

  return savedWorkouts;
};

export const updateWorkoutStatusService = async (data: Request) => {
  const { workoutPlanId } = data.params;

  const checkWorkoutPlan = await WorkoutPlanModel.findOne({
    _id: workoutPlanId,
  });

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
