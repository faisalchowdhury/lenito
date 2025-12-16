import { Types } from "mongoose";
export interface ICaloryItem {
  label: string;
  kcal: number;
}
export interface IMeal extends Document {
  userId: Types.ObjectId;
  mealType: string;
  kcal: number;
  description: string;
  caloryCount: ICaloryItem[];
  ingredients: string[];
  mealGroupId: string;
  date: Date;
}
