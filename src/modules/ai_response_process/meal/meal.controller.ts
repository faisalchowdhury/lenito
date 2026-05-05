import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import {
  calorieIntakeService,
  generateMealImageService,
  generateMealsService,
  scanFoodService,
} from "./meal.service";
import { mealQueue } from "../../../queues/meal.queues";

export const getMeals = catchAsync(async (req: Request, res: Response) => {
  const generateMeals = await generateMealsService(req);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Meal plans fetched successfully",
    data: generateMeals,
  });
});

export const calorieIntake = catchAsync(async (req: Request, res: Response) => {
  const calorieIntake = await calorieIntakeService(req);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Daily calorie intake fetched successfully",
    data: calorieIntake,
  });
});

export const generateMealImage = catchAsync(
  async (req: Request, res: Response) => {
    const generateMealImage = await generateMealImageService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Meal image generate successfully",
      data: generateMealImage,
    });
  },
);

export const scanFood = catchAsync(async (req: Request, res: Response) => {
  const scanFood = await scanFoodService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Food scaned successfully",
    data: scanFood,
  });
});

/////////////////////////////////////////
export const getMealJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        status: "error",
        message: "jobId is required",
      });
    }

    const job = await mealQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        status: "not_found",
      });
    }

    const state = await job.getState();
    console.log(state);
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
    console.error("getMealJobStatus error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
