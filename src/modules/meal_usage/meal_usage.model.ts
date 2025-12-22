import mongoose, { Schema } from "mongoose";
import { IMealUsage } from "./meal_usage.interface";

const MealUsageSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one usage document per user
      index: true,
    },

    mealPlans: [
      {
        planDate: {
          type: String, // YYYY-MM-DD
          required: true,
        },

        meals: {
          type: [
            {
              type: String,
              enum: ["breakfast", "lunch", "dinner"],
            },
          ],
          required: true,
        },

        /**
         * Explicit daily meal count
         * breakfast = 1
         * lunch = 1
         * dinner = 1
         */
        mealCount: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const MealUsageModel = mongoose.model<IMealUsage>(
  "MealUsage",
  MealUsageSchema
);
