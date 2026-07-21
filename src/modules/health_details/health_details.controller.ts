import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import {
  getHealthDetailsService,
  getWeightHistoryService,
  healthDetailsService,
  updateHealthDetailsService,
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
  },
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

export const getWeightHistory = async (req: Request, res: Response) => {
  const getWeightHistory = await getWeightHistoryService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weight history reterive successfully",
    data: getWeightHistory,
  });
};

export const getHealthDetails = catchAsync(
  async (req: Request, res: Response) => {
    const healthDetails = await getHealthDetailsService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Health details retrieved successfully",
      data: healthDetails,
    });
  },
);

export const updateHealthDetails = catchAsync(
  async (req: Request, res: Response) => {
    const updateHealthDetails = await updateHealthDetailsService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Health details updated successfully",
      data: updateHealthDetails,
    });
  },
);
