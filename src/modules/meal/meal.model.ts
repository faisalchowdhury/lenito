import mongoose, { Schema } from "mongoose";
import { IMeal } from "./meal.interface";

const CaloryItemSchema = new Schema({
  label: { type: String, required: true },
  kcal: { type: Number, required: true },
});

const mealSchema = new Schema<IMeal>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mealType: { type: String, required: true },
  kcal: { type: Number, required: true },
  description: { type: String, required: true },
  caloryCount: { type: [CaloryItemSchema], required: true },
  ingredients: { type: [String], required: true },
  mealGroupId: { type: String, required: true },
  image: { type: String, required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    default: "not_yet_done",
    enum: ["not_yet_done", "done"],
  },
});

export const MealModel = mongoose.model<IMeal>("Meal", mealSchema);
