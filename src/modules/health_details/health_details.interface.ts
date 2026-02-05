import { Types } from "mongoose";

export interface IHealth_details extends Document {
  userId: Types.ObjectId;
  bloodGroup: string;
  gender: string;
  age: number;
  country: string;
  weight: number;
  height: number;
  goal: string;
  desiredWeight: number;
  diet: string;
  foodAllergies: string[];
  foodDislikes: string[];
  cheatDay?: string;
}

export interface IWeightHistory extends Document {
  userId: Types.ObjectId;
  weight: number;
  date: Date;
}
