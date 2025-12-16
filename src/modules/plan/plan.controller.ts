import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import ApiError from "../../errors/ApiError";
import { PlanModel } from "./plan.model";
import { createPlanService } from "./plan.service";
import sendResponse from "../../utils/sendResponse";

export const createPlan = catchAsync(async (req: Request, res: Response) => {
  const createPlan = await createPlanService(req);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Plan created successfully",
    data: createPlan,
  });
});
