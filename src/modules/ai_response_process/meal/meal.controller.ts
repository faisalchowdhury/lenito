import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { generateMealsService } from "./meal.service";

export const getMeals = catchAsync(async (req: Request, res: Response) => {
  const generateMeals = await generateMealsService(req);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Meal plans fetched successfully",
    data: generateMeals,
  });
});
