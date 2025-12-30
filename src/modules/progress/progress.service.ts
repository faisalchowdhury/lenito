import { Request } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { MealModel } from "../meal/meal.model";
import { WorkoutPlanModel } from "../workout_plan/workout_plan.model";
import { WeightHistoryModel } from "../health_details/health_details.model";
import { WorkoutModel } from "../workout_details/workout_details.model";

export const processService = async (data: Request) => {
  const user = data.user as JwtPayloadWithUser;
  const userId = user.id;

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

  return {
    meal: { totalMealCount, completedMealCount, mealCompletionPercentage },
    workout: {
      totalWorkoutCount,
      completedWorkoutCount,
      WorkoutCompletionPercentage,
    },
    completionPercentage,
  };
};

// get weight progress

export const getWeightProgressService = async (data: Request) => {
  const user = data.user as JwtPayloadWithUser;
  const userId = user.id;
  console.log(userId);
  const currentData: any = await WeightHistoryModel.findOne({ userId })
    .sort({ date: -1 })
    .lean();

  const initialData: any = await WeightHistoryModel.findOne({ userId })
    .sort({ date: 1 })
    .lean();

  const workoutDetails: any = await WorkoutModel.findOne({ userId });

  return {
    initialWeight: initialData.weight,
    currentWeight: currentData.weight,
    desiredWeight: workoutDetails.desiredWeight,
  };
};
