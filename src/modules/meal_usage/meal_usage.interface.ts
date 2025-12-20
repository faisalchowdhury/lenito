import mongoose, { Schema, Document } from "mongoose";

export interface IMealUsage extends Document {
  userId: mongoose.Types.ObjectId;
  mealPlans: {
    planDate: string; // YYYY-MM-DD
    meals: string[]; // ["breakfast","lunch","dinner"]
  }[];
}
