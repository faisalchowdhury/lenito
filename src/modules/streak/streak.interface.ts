import mongoose from "mongoose";

// ==================== streak.interface.ts ====================
export interface IStreak {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date;
  streakHistory: IStreakDay[];
  totalCompletedDays: number;
}

export interface IStreakDay {
  date: Date;
  mealsCompleted: boolean;
  workoutsCompleted: boolean;
  isFullyCompleted: boolean;
}
