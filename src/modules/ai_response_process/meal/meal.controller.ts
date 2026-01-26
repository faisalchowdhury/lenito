import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import {
  calorieIntakeService,
  generateMealImageService,
  generateMealsService,
  scanFoodService,
} from "./meal.service";

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
