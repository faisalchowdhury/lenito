import mongoose, { Schema } from "mongoose";
import { IHealth_details, IWeightHistory } from "./health_details.interface";

const healthDetailsSchema = new Schema<IHealth_details>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bloodGroup: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  country: { type: String, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  goal: { type: String, required: true, enum: ["lose", "gain", "stay-fit"] },
  desiredWeight: { type: Number, required: true },
  diet: {
    type: String,
    required: true,
    enum: ["classic", "vegan", "pescatarian", "vegetarian"],
  },

  foodAllergies: { type: [String], required: true },
  foodDislikes: { type: [String], required: true },
  cheatDay: {
    type: String,
    required: false,
    enum: ["sat", "sun", "mon", "tue", "wed", "thu", "fri"],
  },
  mealPlanDay: {
    type: [String],
    required: false,
  },
});

const WeightHistorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  weight: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

export const HealthDetailsModel = mongoose.model<IHealth_details>(
  "HealthDetails",
  healthDetailsSchema,
);

export const WeightHistoryModel = mongoose.model<IWeightHistory>(
  "WeightHistory",
  WeightHistorySchema,
);
