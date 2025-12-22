// ==================== streak.service.ts ====================
import { MealModel } from "../meal/meal.model";
import { WorkoutPlanModel } from "../workout_plan/workout_plan.model";
import { StreakModel } from "./streak.model";

import mongoose from "mongoose";

/**
 * Check if user completed all tasks for a specific date
 */
export const checkDailyCompletion = async (
  userId: mongoose.Types.ObjectId,
  date: Date
): Promise<{
  mealsCompleted: boolean;
  workoutsCompleted: boolean;
  isFullyCompleted: boolean;
}> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Check meals
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

  // Check workouts
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
    totalWorkouts > 0 && totalWorkouts === completedWorkouts;

  const isFullyCompleted =
    mealsCompleted && workoutsCompleted && totalMeals > 0 && totalWorkouts > 0;

  return { mealsCompleted, workoutsCompleted, isFullyCompleted };
};

/**
 * Update user streak based on daily completion
 */

const normalizeDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const updateUserStreak = async (
  userId: mongoose.Types.ObjectId,
  date: Date
): Promise<void> => {
  // 1️⃣ Check completion status
  const completion = await checkDailyCompletion(userId, date);
  const today = normalizeDay(date);

  // 2️⃣ Get or create streak
  let streak = await StreakModel.findOne({ userId });
  if (!streak) {
    streak = new StreakModel({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedDays: 0,
      streakHistory: [],
    });
  }

  // 3️⃣ Check if today already exists
  const todayEntry = streak.streakHistory.find(
    (d) => normalizeDay(d.date).getTime() === today.getTime()
  );

  if (todayEntry) {
    // 🔁 Update flags only (no streak recalculation)
    todayEntry.mealsCompleted = completion.mealsCompleted;
    todayEntry.workoutsCompleted = completion.workoutsCompleted;
    todayEntry.isFullyCompleted = completion.isFullyCompleted;

    await streak.save();
    return;
  }

  // 4️⃣ Add new day entry
  streak.streakHistory.push({
    date: today,
    mealsCompleted: completion.mealsCompleted,
    workoutsCompleted: completion.workoutsCompleted,
    isFullyCompleted: completion.isFullyCompleted,
  });

  // 5️⃣ If today not fully completed → do NOT change streak
  if (!completion.isFullyCompleted) {
    await streak.save();
    return;
  }

  // 6️⃣ Calculate streak continuation
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (!streak.lastCompletedDate) {
    // First ever completed day
    streak.currentStreak = 1;
  } else {
    const lastCompleted = normalizeDay(streak.lastCompletedDate);

    if (lastCompleted.getTime() === yesterday.getTime()) {
      // Continue streak
      streak.currentStreak += 1;
    } else {
      // Streak broken → restart
      streak.currentStreak = 1;
    }
  }

  // 7️⃣ Update counters
  streak.lastCompletedDate = today;
  streak.totalCompletedDays += 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

  await streak.save();
};

/**
 * Run nightly check for all users (scheduled task)
 */
export const runNightlyStreakCheck = async (): Promise<void> => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  try {
    // Get all unique user IDs from meals and workouts
    const mealUsers = await MealModel.distinct("userId");
    const workoutUsers = await WorkoutPlanModel.distinct("userId");

    const allUserIds = [
      ...new Set([...mealUsers, ...workoutUsers]),
    ] as mongoose.Types.ObjectId[];

    console.log(`Running nightly streak check for ${allUserIds.length} users`);

    for (const userId of allUserIds) {
      await updateUserStreak(userId, today);
    }

    console.log("Nightly streak check completed successfully");
  } catch (error) {
    console.error("Error in nightly streak check:", error);
    throw error;
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
 * Get weekly streak status (last 7 days)
 */
export const getWeeklyStreakStatus = async (
  userId: mongoose.Types.ObjectId
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const weekData = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekAgo);
    currentDate.setDate(weekAgo.getDate() + i);

    const completion = await checkDailyCompletion(userId, currentDate);

    weekData.push({
      date: currentDate,
      day: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
      ...completion,
    });
  }

  const streak = await getUserStreak(userId);

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createdMeals = [];
  const createdWorkouts = [];

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - (days - 1 - i));
    targetDate.setHours(8, 0, 0, 0);

    // Create meals for this day
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

    // Create workout for this day
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
