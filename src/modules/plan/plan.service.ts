import { Request } from "express";
import ApiError from "../../errors/ApiError";
import { PlanModel } from "./plan.model";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { translateText } from "../../services/translate.service";

export const createPlanService = async (req: Request) => {
  try {
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

    // Slug must match the store product id format:
    //   com.bloodfitltd.bloodfit.{slug}.{monthly|yearly}
    // so it must be lowercase, URL-safe, no spaces or special characters.
    const normalizedSlug = String(slug).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      throw new ApiError(
        400,
        "Slug must be lowercase and URL-safe (letters, numbers, hyphens only — no spaces or special characters)",
      );
    }

    if (!pricing?.monthly?.price || !pricing?.yearly?.price) {
      throw new ApiError(400, "Pricing is invalid");
    }

    if (!limits?.mealsPerWeek || !limits?.mealsPerMonth) {
      throw new ApiError(400, "Limits are required");
    }

    const existingPlan = await PlanModel.findOne({ slug: normalizedSlug });
    if (existingPlan) {
      throw new ApiError(400, "Plan with this slug already exists");
    }

    const plan = await PlanModel.create({
      name,
      slug: normalizedSlug,
      description,
      pricing,
      limits,
      features,
      isPopular,
      isActive,
      createdBy: userId,
    });

    return plan;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.log(err);
  }
};

export const editPlanService = async (req: Request) => {
  try {
    const planId = req.params.id;
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

    const existingPlan = await PlanModel.findById(planId);
    if (!existingPlan) {
      throw new ApiError(404, "Plan not found");
    }

    if (!name || !slug) {
      throw new ApiError(400, "Name and slug are required");
    }

    // Slug must match the store product id format:
    //   com.bloodfitltd.bloodfit.{slug}.{monthly|yearly}
    // so it must be lowercase, URL-safe, no spaces or special characters.
    const normalizedSlug = String(slug).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      throw new ApiError(
        400,
        "Slug must be lowercase and URL-safe (letters, numbers, hyphens only — no spaces or special characters)",
      );
    }

    if (!pricing?.monthly?.price || !pricing?.yearly?.price) {
      throw new ApiError(400, "Pricing is invalid");
    }

    if (!limits?.mealsPerWeek || !limits?.mealsPerMonth) {
      throw new ApiError(400, "Limits are required");
    }

    // Ensure the slug is not used by a different plan
    const slugOwner = await PlanModel.findOne({ slug: normalizedSlug });
    if (slugOwner && slugOwner._id.toString() !== planId) {
      throw new ApiError(400, "Plan with this slug already exists");
    }

    const updatedPlan = await PlanModel.findByIdAndUpdate(
      planId,
      {
        name,
        slug: normalizedSlug,
        description,
        pricing,
        limits,
        features,
        isPopular,
        isActive,
      },
      { new: true, runValidators: true },
    );

    return updatedPlan;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.log(err);
  }
};

// // get plans

// export const getPlanService = async () => {
//   const getPlans = await PlanModel.find();
//   return getPlans;
// };

export const getPlanService = async (req: any) => {
  try {
    const lang = req.lang || "en";
    const role = req.user?.role;

    // Mobile (non-admin) users should only ever see active plans
    const filter = role === "admin" ? {} : { isActive: true };
    const plans = await PlanModel.find(filter).lean();

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

        // translate features array (features are objects: { key, label, included })
        if (Array.isArray(plan.features)) {
          plan.features = await Promise.all(
            plan.features.map(async (f: any) => {
              if (f && typeof f === "object" && f.label) {
                return { ...f, label: await translateText(f.label, lang) };
              }
              return f;
            }),
          );
        }

        // translate limits labels (if exists)
        if (plan.limits) {
          for (const key of Object.keys(plan.limits)) {
            if (plan.limits[key]?.label) {
              plan.limits[key].label = await translateText(
                plan.limits[key].label,
                lang,
              );
            }
          }
        }

        return plan;
      }),
    );

    return translatedPlans;
  } catch (err) {
    console.log(err);
  }
};
