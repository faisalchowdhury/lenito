import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { MealModel } from "./meal.model";
import {
  createMealService,
  createSingleMealService,
  deleteMealService,
  getCurrentMealsService,
  getMealService,
  swapMealService,
  updateMealStatusService,
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

export const updateMealStatus = catchAsync(
  async (req: Request, res: Response) => {
    const updateMealStatus = await updateMealStatusService(req);
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Meal completed successfully",
      data: null,
    });
  }
);

export const getMeal = catchAsync(async (req: Request, res: Response) => {
  const getMeal = await getMealService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Meal Reterive successfully",
    data: getMeal,
  });
});

export const deleteMeal = catchAsync(async (req: Request, res: Response) => {
  const deleteMeal = await deleteMealService(req);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Meal deleted successfully",
    data: null,
  });
});

export const createSingleMeal = catchAsync(
  async (req: Request, res: Response) => {
    const createSingleMeal = await createSingleMealService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Meal created successfully",
      data: createSingleMeal,
    });
  }
);
