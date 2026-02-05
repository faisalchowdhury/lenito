import { Types } from "mongoose";

export interface ICalories {
  userId: Types.ObjectId;
  totalCalorie: number;
  carbs: number;
  protein: number;
  fat: number;
}
