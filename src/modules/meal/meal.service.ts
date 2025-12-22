import { Request } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { MealModel } from "./meal.model";
import ApiError from "../../errors/ApiError";
import uniqid from "uniqid";
import { Types } from "mongoose";
import dayjs from "dayjs";
import { MealUsageModel } from "../meal_usage/meal_usage.model";
// create meal service
// previous logic
// export const createMealService = async (req: Request) => {
//   const { date, meals } = req.body;
//   const user = req.user as JwtPayloadWithUser;
//   const subscription = (req as any).subscription;

//   const dateStr = dayjs(date).format("YYYY-MM-DD");

//   // ---- DATE VALIDATION (DO NOT REMOVE EXISTING LOGIC) ----
//   const todayStr = dayjs().format("YYYY-MM-DD");

//   //  Prevent previous day planning
//   if (dayjs(dateStr).isBefore(todayStr)) {
//     throw new ApiError(400, "You cannot plan meals for previous days");
//   }

//   //  Prevent planning outside subscription period
//   if (subscription) {
//     const subStart = dayjs(subscription.startDate).format("YYYY-MM-DD");
//     const subEnd = dayjs(subscription.endDate).format("YYYY-MM-DD");

//     if (dayjs(dateStr).isBefore(subStart)) {
//       throw new ApiError(
//         400,
//         "You cannot plan meals before your subscription start date"
//       );
//     }

//     if (dayjs(dateStr).isAfter(subEnd)) {
//       throw new ApiError(
//         400,
//         "Your subscription has expired. Please renew to plan meals"
//       );
//     }
//   }

//   const userId = user.id;

//   const weeklyLimit = subscription?.planId?.limits?.mealsPerWeek ?? 1;
//   const monthlyLimit = subscription?.planId?.limits?.mealsPerMonth ?? 4;

//   // Selected meals for the day
//   const selectedMeals = Object.keys(meals).filter(
//     (m) => Array.isArray(meals[m]) && meals[m].length > 0
//   );
//   if (selectedMeals.length === 0) throw new ApiError(400, "No meals selected");

//   // --- Find or create usage record ---
//   let usage = await MealUsageModel.findOne({ userId });
//   if (!usage) {
//     usage = new MealUsageModel({ userId, mealPlans: [] });
//   }

//   // --- Check weekly limit ---
//   const weekStart = dayjs(date).startOf("week").format("YYYY-MM-DD");
//   const weekEnd = dayjs(date).endOf("week").format("YYYY-MM-DD");

//   const weeklyPlans = usage.mealPlans.filter(
//     (p) => p.planDate >= weekStart && p.planDate <= weekEnd
//   );

//   if (weeklyPlans.length >= weeklyLimit) {
//     throw new ApiError(
//       403,
//       `Weekly meal plan limit reached (${weeklyLimit} days)`
//     );
//   }

//   // --- Check monthly limit ---
//   const monthStart = dayjs(date).startOf("month").format("YYYY-MM-DD");
//   const monthEnd = dayjs(date).endOf("month").format("YYYY-MM-DD");

//   const monthlyPlans = usage.mealPlans.filter(
//     (p) => p.planDate >= monthStart && p.planDate <= monthEnd
//   );

//   if (monthlyPlans.length >= monthlyLimit) {
//     throw new ApiError(
//       403,
//       `Monthly meal plan limit reached (${monthlyLimit} days)`
//     );
//   }

//   // --- Prevent duplicate meal plan for same day ---
//   const existingPlan = usage.mealPlans.find((p) => p.planDate === dateStr);
//   if (existingPlan)
//     throw new ApiError(400, "Meal plan for this day already exists");

//   // --- Add new meal plan ---
//   usage.mealPlans.push({ planDate: dateStr, meals: selectedMeals });
//   await usage.save();

//   // --- Create MealModel documents ---
//   const mealGroupId = uniqid();
//   const mealDocs: any[] = [];

//   for (const mealType of selectedMeals) {
//     const mealList = meals[mealType];
//     for (const meal of mealList) {
//       const caloryCount = Array.isArray(meal.caloryCount)
//         ? meal.caloryCount.map((i: any) => ({ label: i.label, kcal: i.kcal }))
//         : [];
//       const totalKcal = caloryCount.reduce(
//         (sum: number, i: any) => sum + i.kcal,
//         0
//       );

//       mealDocs.push({
//         userId,
//         mealGroupId,
//         planDate: dateStr,
//         mealType,
//         description: meal.description,
//         ingredients: meal.ingredients || [],
//         caloryCount,
//         date,
//         kcal: totalKcal,
//       });
//     }
//   }

//   const savedMeals = await MealModel.insertMany(mealDocs);
//   return savedMeals;
// };
export const createMealService = async (req: Request) => {
  const { date, meals } = req.body;
  const user = req.user as JwtPayloadWithUser;
  const subscription = (req as any).subscription;

  const userId = user.id;
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const todayStr = dayjs().format("YYYY-MM-DD");

  // ---------------- DATE VALIDATION ----------------

  if (dayjs(dateStr).isBefore(todayStr)) {
    throw new ApiError(400, "You cannot plan meals for previous days");
  }

  if (subscription) {
    const subStart = dayjs(subscription.startDate).format("YYYY-MM-DD");
    const subEnd = dayjs(subscription.endDate).format("YYYY-MM-DD");

    if (dayjs(dateStr).isBefore(subStart)) {
      throw new ApiError(
        400,
        "You cannot plan meals before your subscription start date"
      );
    }

    if (dayjs(dateStr).isAfter(subEnd)) {
      throw new ApiError(
        400,
        "Your subscription has expired. Please renew to plan meals"
      );
    }
  }

  // ---------------- PLAN LIMITS ----------------

  const weeklyLimit = subscription?.planId?.limits?.mealsPerWeek ?? 1;
  const monthlyLimit = subscription?.planId?.limits?.mealsPerMonth ?? 4;

  // ---------------- SELECTED MEALS ----------------
  const ALLOWED_MEALS = ["breakfast", "lunch", "dinner"] as const;
  type MealType = (typeof ALLOWED_MEALS)[number];

  const selectedMeals: MealType[] = Object.keys(meals).filter(
    (m): m is MealType =>
      ALLOWED_MEALS.includes(m as MealType) &&
      Array.isArray(meals[m]) &&
      meals[m].length > 0
  );

  if (selectedMeals.length === 0) {
    throw new ApiError(400, "No meals selected");
  }

  // ---------------- MEAL USAGE ----------------

  let usage = await MealUsageModel.findOne({ userId });
  if (!usage) {
    usage = new MealUsageModel({ userId, mealPlans: [] });
  }

  const existingPlan = usage.mealPlans.find((p) => p.planDate === dateStr);
  if (existingPlan) {
    throw new ApiError(400, "Meal plan for this day already exists");
  }

  // ---------------- WEEKLY LIMIT CHECK ----------------

  const weekStart = dayjs(dateStr).startOf("week").format("YYYY-MM-DD");
  const weekEnd = dayjs(dateStr).endOf("week").format("YYYY-MM-DD");

  const weeklyPlans = usage.mealPlans.filter(
    (p) => p.planDate >= weekStart && p.planDate <= weekEnd
  );

  const weeklyMealCount = weeklyPlans.reduce(
    (sum, p) => sum + (p.mealCount ?? p.meals.length),
    0
  );

  if (weeklyMealCount + selectedMeals.length > weeklyLimit) {
    throw new ApiError(403, `Weekly meal limit reached (${weeklyLimit} meals)`);
  }

  // ---------------- MONTHLY LIMIT CHECK ----------------

  const monthStart = dayjs(dateStr).startOf("month").format("YYYY-MM-DD");
  const monthEnd = dayjs(dateStr).endOf("month").format("YYYY-MM-DD");

  const monthlyPlans = usage.mealPlans.filter(
    (p) => p.planDate >= monthStart && p.planDate <= monthEnd
  );

  const monthlyMealCount = monthlyPlans.reduce(
    (sum, p) => sum + (p.mealCount ?? p.meals.length),
    0
  );

  if (monthlyMealCount + selectedMeals.length > monthlyLimit) {
    throw new ApiError(
      403,
      `Monthly meal limit reached (${monthlyLimit} meals)`
    );
  }

  // ---------------- SAVE MEAL USAGE ----------------

  usage.mealPlans.push({
    planDate: dateStr,
    meals: selectedMeals,
    mealCount: selectedMeals.length,
  });

  await usage.save();

  // ---------------- CREATE MEALS ----------------

  const mealGroupId = uniqid();
  const mealDocs: any[] = [];

  for (const mealType of selectedMeals) {
    const mealList = meals[mealType];

    for (const meal of mealList) {
      const caloryCount = Array.isArray(meal.caloryCount)
        ? meal.caloryCount.map((i: any) => ({
            label: i.label,
            kcal: i.kcal,
          }))
        : [];

      const totalKcal = caloryCount.reduce(
        (sum: number, i: any) => sum + i.kcal,
        0
      );

      mealDocs.push({
        userId,
        mealGroupId,
        planDate: dateStr,
        mealType,
        description: meal.description,
        ingredients: meal.ingredients || [],
        caloryCount,
        date,
        kcal: totalKcal,
      });
    }
  }

  const savedMeals = await MealModel.insertMany(mealDocs);
  return savedMeals;
};

// get current date meals service

export const getCurrentMealsService = async (req: Request) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const today = dayjs().format("YYYY-MM-DD");

    // Fetch meals for today
    const meals = await MealModel.find({ userId, date: today });

    // Map meals by type (single object per type)
    const mealPlan: Record<string, any | null> = {
      breakfast: null,
      lunch: null,
      dinner: null,
    };

    meals.forEach((meal) => {
      mealPlan[meal.mealType] = meal;
    });

    return mealPlan;
  } catch (error) {
    throw error;
  }
};

// swap meal

export const swapMealService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;
  const { mealId } = req.params;
  const { meal } = req.body;

  if (!mealId) {
    throw new ApiError(400, "Meal Id is required");
  }

  if (!meal || typeof meal !== "object") {
    throw new ApiError(400, "Meal data is required");
  }

  const swapMealPayload: any = {};

  if (meal.breakfast.description !== undefined)
    swapMealPayload.description = meal.breakfast.description;
  if (meal.breakfast.ingredients !== undefined)
    swapMealPayload.ingredients = meal.breakfast.ingredients;
  if (meal.breakfast.caloryCount !== undefined)
    swapMealPayload.caloryCount = meal.breakfast.caloryCount;
  // Calculate total kcal from caloryCount
  const totalKcal = meal.breakfast.caloryCount.reduce(
    (sum: number, item: { label: string; kcal: number }) => sum + item.kcal,
    0
  );
  swapMealPayload.kcal = totalKcal;
  // Update the meal document and return the updated meal
  const swappedMeal = await MealModel.findOneAndUpdate(
    { _id: mealId, userId },
    swapMealPayload,
    { new: true }
  );

  if (!swappedMeal) {
    throw new ApiError(404, "Meal not found or you do not have permission");
  }

  return swappedMeal;
};

export const updateMealStatusService = async (data: Request) => {
  const { mealId } = data.params;
  console.log(mealId);
  const checkStatus = await MealModel.findOne({ _id: mealId });

  if (!checkStatus) {
    throw new ApiError(400, "Meal not found");
  } else if (checkStatus?.status === "done") {
    throw new ApiError(400, "This meal is already completed");
  }

  const updateStatus = await MealModel.updateOne(
    { _id: mealId },
    { status: "done" }
  );

  return updateStatus;
};

export const getMealService = async (data: Request) => {
  const { mealId } = data.params;

  const getMeal = await MealModel.findOne({ _id: mealId });

  if (!getMeal) {
    throw new ApiError(400, "Meal not found");
  }

  return getMeal;
};
