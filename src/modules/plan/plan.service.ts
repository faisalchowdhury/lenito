import { Request } from "express";
import ApiError from "../../errors/ApiError";
import { PlanModel } from "./plan.model";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { translateText } from "../../services/translate.service";

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

// // get plans

// export const getPlanService = async () => {
//   const getPlans = await PlanModel.find();
//   return getPlans;
// };

export const getPlanService = async (req: any) => {
  const lang = req.lang || "en";

  const plans = await PlanModel.find().lean();

  if (lang === "en") return plans;

  const translatedPlans = await Promise.all(
    plans.map(async (plan: any) => {
      // translate root fields
      if (plan.name) {
        plan.name = await translateText(plan.name, lang);
      }

      if (plan.description) {
        plan.description = await translateText(plan.description, lang);
      }

      // translate features array
      if (Array.isArray(plan.features)) {
        plan.features = await Promise.all(
          plan.features.map((f: string) => translateText(f, lang))
        );
      }

      // translate limits labels (if exists)
      if (plan.limits) {
        for (const key of Object.keys(plan.limits)) {
          if (plan.limits[key]?.label) {
            plan.limits[key].label = await translateText(
              plan.limits[key].label,
              lang
            );
          }
        }
      }

      return plan;
    })
  );

  return translatedPlans;
};
