import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { addCalorieService } from "./calories.service";

export const addCalorie = catchAsync(async (req: Request, res: Response) => {
  const addCalorie = await addCalorieService(req);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Calorie requirement added successfully",
    data: addCalorie,
  });
});
