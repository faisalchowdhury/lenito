import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { PlanModel } from "./plan.model";
import {
  createPlanService,
  editPlanService,
  getPlanService,
} from "./plan.service";
import sendResponse from "../../utils/sendResponse";

// create plan
export const createPlan = catchAsync(async (req: Request, res: Response) => {
  const createPlan = await createPlanService(req);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Plan created successfully",
    data: createPlan,
  });
});

// edit plan
export const editPlan = catchAsync(async (req: Request, res: Response) => {
  const updatedPlan = await editPlanService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plan updated successfully",
    data: updatedPlan,
  });
});

// get plans
export const getPlans = catchAsync(async (req: Request, res: Response) => {
  const getPlans = await getPlanService(req);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plans reterive successfully",
    data: getPlans,
  });
});

export const deletePlan = catchAsync(async (req: Request, res: Response) => {
  const planId = req.params.id;

  const deletedPlan = await PlanModel.findByIdAndDelete(planId);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Plan deleted successfully",
    data: deletedPlan,
  });
});
