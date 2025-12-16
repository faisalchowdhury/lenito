import { Request } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { WorkoutModel } from "./workout_details.model";
import ApiError from "../../errors/ApiError";

export const addWorkoutDetailsService = async (data: Request) => {
  const user = data.user as JwtPayloadWithUser;
  const userId = user?.id;

  const isExist = await WorkoutModel.findOne({ userId });
  if (isExist) {
    throw new ApiError(400, "workout details already added");
  }

  const { bodyShape, activityLevel, prefferedWorkout, goal, focusArea } =
    data.body;

  const workoutPayload = {
    userId,
    bodyShape,
    activityLevel,
    prefferedWorkout,
    goal,
    focusArea,
  };

  const workoutDetails = await WorkoutModel.create(workoutPayload);

  return workoutDetails;
};
