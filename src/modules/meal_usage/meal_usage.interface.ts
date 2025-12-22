import mongoose, { Schema, Document } from "mongoose";

export interface IMealUsage extends Document {
  userId: mongoose.Types.ObjectId;

  mealPlans: {
    planDate: string; // YYYY-MM-DD

    meals: ("breakfast" | "lunch" | "dinner")[];

    /**
     * Number of meals used that day
     * breakfast = 1, lunch = 1, dinner = 1
     */
    mealCount: number;
  }[];
}
