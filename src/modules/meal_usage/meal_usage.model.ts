import mongoose, { Schema } from "mongoose";
import { IMealUsage } from "./meal_usage.interface";

const MealUsageSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mealPlans: [
    {
      planDate: { type: String, required: true },
      meals: [{ type: String, enum: ["breakfast", "lunch", "dinner"] }],
    },
  ],
});

export const MealUsageModel = mongoose.model<IMealUsage>(
  "MealUsage",
  MealUsageSchema
);
