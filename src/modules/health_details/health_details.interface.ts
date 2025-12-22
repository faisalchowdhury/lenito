import { Types } from "mongoose";

export interface IHealth_details extends Document {
  userId: Types.ObjectId;
  bloodGroup: string;
  gender: string;
  age: number;
  address: string;
  weight: number;
  height: number;
  diet: string;
  foodAllergies: string[];
  foodDislikes: string[];
}

export interface IWeightHistory extends Document {
  userId: Types.ObjectId;
  weight: number;
  date: Date;
}
