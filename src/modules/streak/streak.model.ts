// ==================== streak.model.ts ====================
import mongoose, { Schema } from "mongoose";
import { IStreak } from "./streak.interface";

const StreakDaySchema = new Schema({
  date: { type: Date, required: true },
  mealsCompleted: { type: Boolean, required: true },
  workoutsCompleted: { type: Boolean, required: true },
  isFullyCompleted: { type: Boolean, required: true },
});

const streakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: {
      type: Date,
    },
    streakHistory: {
      type: [StreakDaySchema],
      default: [],
    },
    totalCompletedDays: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const StreakModel = mongoose.model<IStreak>("Streak", streakSchema);
