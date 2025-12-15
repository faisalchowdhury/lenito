import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import {
  healthDetailsService,
  updateWeightService,
} from "./health_details.service";
import sendResponse from "../../utils/sendResponse";

export const createHealthdetails = catchAsync(
  async (req: Request, res: Response) => {
    const healthDetails = await healthDetailsService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Health details added successfully",
      data: healthDetails,
    });
  }
);

export const updateWeight = catchAsync(async (req: Request, res: Response) => {
  const updateWeight = await updateWeightService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weight updated successfully",
    data: null,
  });
});
