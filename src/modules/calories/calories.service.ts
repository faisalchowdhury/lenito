import axios from "axios";
import { HealthDetailsModel } from "../health_details/health_details.model";
import { CalorieModel } from "./calories.model";
import ApiError from "../../errors/ApiError";
import { MealModel } from "../meal/meal.model";
import { WorkoutPlanModel } from "../workout_plan/workout_plan.model";

export const calorieRequirementService = async (userId: string) => {
  try {
    const health = await HealthDetailsModel.findOne({ userId });
    if (!health) {
      throw new ApiError(404, "Health details not found");
    }

    const { bloodGroup, diet, age, weight, height } = health;

    const response = await axios.get(
      `${process.env.AI_SERVER_BASE}/meal/calculate-daily-nutrition`,
      {
        params: {
          user_id: userId,
          blood_type: bloodGroup,
          diet_type: diet,
          age,
          weight,
          height,
          activity_level: "moderate",
          health_goals: "maintain weight",
        },
        timeout: 10000,
      },
    );

    if (!response.data) {
      throw new Error("Invalid response from AI server");
    }

    const { total_daily_calories, total_daily_macronutrients } = response.data;

    return await CalorieModel.create({
      userId,
      totalCalorie: total_daily_calories,
      carbs: total_daily_macronutrients.carbohydrates,
      protein: total_daily_macronutrients.protein,
      fat: total_daily_macronutrients.fat,
    });
  } catch (error: any) {
    console.error(
      "Calorie requirement calculation failed:",
      error?.response?.data || error.message,
    );

    return null;
  }
};

export const getCalorieRequirementService = async (userId: string) => {
  const today = new Date().toISOString().split("T")[0];

  // Total meals for today (100%)
  const totalMealCount = await MealModel.countDocuments({
    userId,
    date: today,
  });

  // Completed meals
  const completedMealCount = await MealModel.countDocuments({
    userId,
    date: today, // or dateOnly: today
    status: "done",
  });

  // Avoid division by zero
  const mealCompletionPercentage =
    totalMealCount === 0
      ? 0
      : Math.round((completedMealCount / totalMealCount) * 100);

  // find workout report

  const totalWorkoutCount = await WorkoutPlanModel.countDocuments({
    userId,
    workoutDate: today,
  });

  const completedWorkoutCount = await WorkoutPlanModel.countDocuments({
    userId,
    workoutDate: today,
    status: "done",
  });

  const WorkoutCompletionPercentage =
    totalWorkoutCount === 0
      ? 0
      : Math.round((completedWorkoutCount / totalWorkoutCount) * 100);

  const totalTaskCount = totalMealCount + totalWorkoutCount;
  const totalTaskCompletedCount = completedMealCount + completedWorkoutCount;

  const completionPercentage =
    totalTaskCount === 0
      ? 0
      : Math.round((totalTaskCompletedCount / totalTaskCount) * 100);

  const getCalorie = await CalorieModel.findOne({ userId });

  return {
    meal: { totalMealCount, completedMealCount, mealCompletionPercentage },
    workout: {
      totalWorkoutCount,
      completedWorkoutCount,
      WorkoutCompletionPercentage,
    },
    completionPercentage,
    calorieRequirement: getCalorie,
  };
};
