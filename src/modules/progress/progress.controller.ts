import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { getWeightProgressService, processService } from "./progress.service";
import sendResponse from "../../utils/sendResponse";
// progress
export const progress = catchAsync(async (req: Request, res: Response) => {
  const progress = await processService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: false,
    message: "Progress information reterive successfully",
    data: progress,
  });
});

export const weightProgress = catchAsync(
  async (req: Request, res: Response) => {
    const getWeightProgress = await getWeightProgressService(req);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Weight progress reterived successfully",
      data: getWeightProgress,
    });
  }
);
