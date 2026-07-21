// controllers/workout.controller.ts
import { Request, Response } from "express";
import {
  createWorkoutService,
  deleteWorkoutPlanService,
  checkActiveWorkoutPlanService,
  generateWorkoutPlanService,
  getGeneratedWorkoutPlanService,
  getWorkoutPlanHistoryService,
  updateGeneratedDayStatusService,
  updateWorkoutStatusService,
} from "./workout_plan.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { workoutQueue } from "../../queues/workout.queues";

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

export const generateWorkout = catchAsync(
  async (req: Request, res: Response) => {
    const workoutPlan = await generateWorkoutPlanService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Workout plan generation started",
      data: workoutPlan,
    });
  }
);

export const getWorkoutJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        status: "error",
        message: "jobId is required",
      });
    }

    const job = await workoutQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        status: "not_found",
      });
    }

    const state = await job.getState();

    if (state === "completed") {
      return res.json({
        status: "completed",
        result: job.returnvalue,
      });
    }

    if (state === "failed") {
      return res.json({
        status: "failed",
        error: job.failedReason,
      });
    }

    return res.json({
      status: state, // waiting | active | delayed
    });
  } catch (error) {
    console.error("getWorkoutJobStatus error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getGeneratedWorkoutPlan = catchAsync(
  async (req: Request, res: Response) => {
    const plan = await getGeneratedWorkoutPlanService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Workout plan retrieved successfully",
      data: plan,
    });
  }
);

export const checkActiveWorkoutPlan = catchAsync(
  async (req: Request, res: Response) => {
    const result = await checkActiveWorkoutPlanService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.hasActivePlan
        ? "An active workout plan exists for this week"
        : "No active workout plan for this week",
      data: result,
    });
  }
);

export const getWorkoutPlanHistory = catchAsync(
  async (req: Request, res: Response) => {
    const history = await getWorkoutPlanHistoryService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Workout plan history retrieved successfully",
      data: history,
    });
  }
);

export const updateGeneratedDayStatus = catchAsync(
  async (req: Request, res: Response) => {
    const plan = await updateGeneratedDayStatusService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Workout day status updated successfully",
      data: plan,
    });
  }
);

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
