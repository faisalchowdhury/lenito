// controllers/workout.controller.ts
import { Request, Response } from "express";
import {
  createWorkoutService,
  deleteWorkoutPlanService,
  updateWorkoutStatusService,
} from "./workout_plan.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { WorkoutPlanModel } from "./workout_plan.model";

export const createWorkout = catchAsync(async (req: Request, res: Response) => {
  const createWorkout = await createWorkoutService(req);
  console.log(createWorkout);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Workout plans created successfully",
    data: createWorkout,
  });
});

export const updateWorkoutStatus = catchAsync(
  async (req: Request, res: Response) => {
    const updateWorkoutStatus = await updateWorkoutStatusService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Workout status mark as completed",
      data: null,
    });
  }
);

export const deleteWorkoutPlan = catchAsync(
  async (req: Request, res: Response) => {
    const deleteWorkoutPlan = await deleteWorkoutPlanService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Workout plan deleted successfully",
      data: null,
    });
  }
);
