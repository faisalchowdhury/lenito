import mongoose, { Schema, Types } from "mongoose";
import { ICalories } from "./calories.interface";

export const caloriesSchema = new Schema<ICalories>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  totalCalorie: { type: Number, required: true },
  carbs: { type: Number, required: true },
  protein: { type: Number, required: true },
  fat: { type: Number, required: true },
});

export const CalorieModel = mongoose.model("Calorie", caloriesSchema);
