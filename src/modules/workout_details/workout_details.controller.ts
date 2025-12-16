import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { addWorkoutDetailsService } from "./workout_details.service";
import sendResponse from "../../utils/sendResponse";

export const addWorkoutDetails = catchAsync(
  async (req: Request, res: Response) => {
    const addWorkoutDetails = await addWorkoutDetailsService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "workout details added successfully",
      data: addWorkoutDetails,
    });
  }
);
