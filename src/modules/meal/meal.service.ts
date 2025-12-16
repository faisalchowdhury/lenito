import { Request } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { MealModel } from "./meal.model";
import ApiError from "../../errors/ApiError";
import uniqid from "uniqid";
import { Types } from "mongoose";
import dayjs from "dayjs";
// create meal service
export const createMealService = async (req: Request) => {
  const { date, meals } = req.body;
  const user = req.user as JwtPayloadWithUser;

  if (!date || !meals) {
    throw new ApiError(400, "Date and meals are required");
  }
  const today = dayjs().format("YYYY-MM-DD");

  const findMeals = await MealModel.find({ date: today, userId: user.id });

  if (findMeals.length > 0) {
    throw new ApiError(400, "Meals for today already exist ");
  }

  const userId = user.id;
  const mealGroupId = uniqid();
  const mealDocs: any[] = [];

  for (const [mealType, mealList] of Object.entries(meals)) {
    if (!Array.isArray(mealList)) continue;

    for (const meal of mealList) {
      // Ensure caloryCount is an array of { label, kcal }
      const caloryCount = Array.isArray(meal.caloryCount)
        ? meal.caloryCount.map((item: any) => ({
            label: item.label,
            kcal: item.kcal,
          }))
        : [];

      // Calculate total kcal from caloryCount
      const totalKcal = caloryCount.reduce(
        (sum: number, item: { label: string; kcal: number }) => sum + item.kcal,
        0
      );

      mealDocs.push({
        userId,
        date,
        mealType,
        kcal: totalKcal,
        caloryCount,
        description: meal.description,
        ingredients: meal.ingredients || [],
        mealGroupId,
      });
    }
  }

  if (mealDocs.length === 0) {
    throw new ApiError(400, "No valid meals provided");
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

  // Prepare payload for update
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
