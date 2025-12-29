import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { processService } from "./progress.service";
import sendResponse from "../../utils/sendResponse";

export const progress = catchAsync(async (req: Request, res: Response) => {
  const progress = await processService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: false,
    message: "Progress information reterive successfully",
    data: progress,
  });
});
