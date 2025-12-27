// ==================== streak.service.ts ====================
import { MealModel } from "../meal/meal.model";
import { WorkoutPlanModel } from "../workout_plan/workout_plan.model";
import { StreakModel } from "./streak.model";

import mongoose from "mongoose";

/**
 * Normalize date to UTC midnight to avoid timezone issues
 */
const normalizeDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Check if user completed all tasks for a specific date
 */
export const checkDailyCompletion = async (
  userId: mongoose.Types.ObjectId,
  date: Date
) => {
  const startOfDay = normalizeDay(date);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // -------- MEALS (REQUIRED) --------
  const totalMeals = await MealModel.countDocuments({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  const completedMeals = await MealModel.countDocuments({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: "done",
  });

  const mealsCompleted = totalMeals > 0 && totalMeals === completedMeals;

  // -------- WORKOUTS (OPTIONAL) --------
  const totalWorkouts = await WorkoutPlanModel.countDocuments({
    userId,
    workoutDate: { $gte: startOfDay, $lte: endOfDay },
  });

  const completedWorkouts = await WorkoutPlanModel.countDocuments({
    userId,
    workoutDate: { $gte: startOfDay, $lte: endOfDay },
    status: "done",
  });

  const workoutsCompleted =
    totalWorkouts === 0 || totalWorkouts === completedWorkouts;

  const isFullyCompleted = mealsCompleted && workoutsCompleted;

  return { mealsCompleted, workoutsCompleted, isFullyCompleted };
};

/**
 * Update user streak based on daily completion
 */
export const updateUserStreak = async (
  userId: mongoose.Types.ObjectId,
  date: Date
): Promise<void> => {
  const today = normalizeDay(date);
  const completion = await checkDailyCompletion(userId, today);

  let streak = await StreakModel.findOne({ userId });
  if (!streak) {
    streak = new StreakModel({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedDays: 0,
      streakHistory: [],
      lastCompletedDate: null,
    });
  }

  // Prevent duplicate processing
  const alreadyProcessed = streak.streakHistory.find(
    (d) => normalizeDay(d.date).getTime() === today.getTime()
  );
  if (alreadyProcessed) return;

  // Hard reset if today is incomplete
  if (!completion.isFullyCompleted) {
    streak.currentStreak = 0;
    streak.streakHistory = [];
    streak.totalCompletedDays = 0;
    // streak.lastCompletedDate = null;
    await streak.save();
    return;
  }

  // Add today entry.
  streak.streakHistory.push({
    date: today,
    mealsCompleted: completion.mealsCompleted,
    workoutsCompleted: completion.workoutsCompleted,
    isFullyCompleted: completion.isFullyCompleted,
  });

  // Calculate streak
  if (!streak.lastCompletedDate) {
    streak.currentStreak = 1;
  } else {
    const last = normalizeDay(streak.lastCompletedDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    streak.currentStreak =
      last.getTime() === yesterday.getTime() ? streak.currentStreak + 1 : 1;
  }

  streak.lastCompletedDate = today;
  streak.totalCompletedDays += 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

  await streak.save();
};

/**
 * Run nightly check for all users (scheduled task)
 */
export const runNightlyStreakCheck = async (): Promise<void> => {
  const today = normalizeDay(new Date());

  const mealUsers = await MealModel.distinct("userId");
  const workoutUsers = await WorkoutPlanModel.distinct("userId");

  const allUserIds = [
    ...new Set([...mealUsers, ...workoutUsers]),
  ] as mongoose.Types.ObjectId[];

  for (const userId of allUserIds) {
    await updateUserStreak(userId, today);
  }
};

/**
 * Get user streak information
 */
export const getUserStreak = async (userId: mongoose.Types.ObjectId) => {
  let streak = await StreakModel.findOne({ userId });

  if (!streak) {
    streak = new StreakModel({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      streakHistory: [],
      totalCompletedDays: 0,
    });

    await streak.save();
  }

  return streak;
};

/**
 * Get weekly streak status (only consecutive streak days including today)
 */
export const getWeeklyStreakStatus = async (
  userId: mongoose.Types.ObjectId
) => {
  const streak = await getUserStreak(userId);

  const today = normalizeDay(new Date());
  const todayCompletion = await checkDailyCompletion(userId, today);

  const weekData: typeof streak.streakHistory = [];
  let previousDate: Date | null = null;

  for (const entry of streak.streakHistory) {
    if (!entry.isFullyCompleted) continue;

    if (previousDate) {
      const expectedDate = new Date(previousDate);
      expectedDate.setDate(previousDate.getDate() + 1);

      if (
        normalizeDay(entry.date).getTime() !==
        normalizeDay(expectedDate).getTime()
      ) {
        break; // streak chain broken
      }
    }

    weekData.push(entry);
    previousDate = entry.date;
  }

  // Add today if fully completed and consecutive
  if (
    todayCompletion.isFullyCompleted &&
    (!previousDate ||
      normalizeDay(previousDate).getTime() + 86400000 === today.getTime())
  ) {
    weekData.push({
      date: today,
      ...todayCompletion,
    });
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalCompletedDays: streak.totalCompletedDays,
    weekData,
  };
};

/**
 * TEST ONLY: Create test data for multiple days
 */
export const createTestData = async (
  userId: mongoose.Types.ObjectId,
  days: number = 7,
  allCompleted: boolean = true
) => {
  const today = normalizeDay(new Date());

  const createdMeals = [];
  const createdWorkouts = [];

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - (days - 1 - i));
    targetDate.setHours(8, 0, 0, 0);

    const mealTypes = ["Breakfast", "Lunch", "Dinner"];
    for (const mealType of mealTypes) {
      const meal = await MealModel.create({
        userId,
        mealType,
        kcal: 500,
        description: `Test ${mealType} for ${targetDate.toDateString()}`,
        caloryCount: [{ label: "Test Food", kcal: 500 }],
        ingredients: ["test ingredient"],
        mealGroupId: `test-group-${i}`,
        date: targetDate,
        status: allCompleted || i < days - 2 ? "done" : "not_yet_done",
      });
      createdMeals.push(meal);
    }

    const workout = await WorkoutPlanModel.create({
      userId,
      workoutName: `Test Workout ${i + 1}`,
      duration: 30,
      focusArea: "Full Body",
      status: allCompleted || i < days - 2 ? "done" : "not_yet_done",
      workoutDate: targetDate,
    });
    createdWorkouts.push(workout);
  }

  return {
    mealsCreated: createdMeals.length,
    workoutsCreated: createdWorkouts.length,
    daysWithData: days,
    allCompleted,
  };
};

/**
 * TEST ONLY: Calculate streak for multiple past days
 */
export const calculatePastStreak = async (
  userId: mongoose.Types.ObjectId,
  days: number = 7
) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const results = [];

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);

    await updateUserStreak(userId, targetDate);

    const completion = await checkDailyCompletion(userId, targetDate);
    results.push({
      date: targetDate.toDateString(),
      ...completion,
    });
  }

  const streak = await getUserStreak(userId);

  return {
    processedDays: results,
    finalStreak: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalCompletedDays: streak.totalCompletedDays,
    },
  };
};

/**
 * TEST ONLY: Reset user streak completely
 */
export const resetUserStreak = async (userId: mongoose.Types.ObjectId) => {
  await StreakModel.findOneAndUpdate(
    { userId },
    {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      streakHistory: [],
      totalCompletedDays: 0,
    },
    { upsert: true, new: true }
  );
};
