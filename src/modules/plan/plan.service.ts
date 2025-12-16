import { Request } from "express";
import ApiError from "../../errors/ApiError";
import { PlanModel } from "./plan.model";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";

export const createPlanService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;
  const {
    name,
    slug,
    description,
    pricing,
    limits,
    features,
    isPopular,
    isActive,
  } = req.body;

  if (!name || !slug) {
    throw new ApiError(400, "Name and slug are required");
  }

  if (!pricing?.monthly?.price || !pricing?.yearly?.price) {
    throw new ApiError(400, "Pricing is invalid");
  }

  if (!limits?.mealsPerWeek || !limits?.mealsPerMonth) {
    throw new ApiError(400, "Limits are required");
  }

  const existingPlan = await PlanModel.findOne({ slug });
  if (existingPlan) {
    throw new ApiError(400, "Plan with this slug already exists");
  }

  const plan = await PlanModel.create({
    name,
    slug,
    description,
    pricing,
    limits,
    features,
    isPopular,
    isActive,
    createdBy: userId,
  });
};
