import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { MealModel } from "./meal.model";
import {
  createMealService,
  getCurrentMealsService,
  swapMealService,
} from "./meal.service";
import sendResponse from "../../utils/sendResponse";

// create meal controller
export const createMeals = catchAsync(async (req: Request, res: Response) => {
  const createMealData = await createMealService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Meals created successfully",
    data: createMealData,
  });
});

//get current date meals controller

export const getCurrentMeals = catchAsync(
  async (req: Request, res: Response) => {
    const getCurrentMeals = await getCurrentMealsService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Todays meal reterive successfully",
      data: getCurrentMeals,
    });
  }
);

export const swapMeal = catchAsync(async (req: Request, res: Response) => {
  const swapMeal = await swapMealService(req);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Meal swapped successfully",
    data: swapMeal,
  });
});
