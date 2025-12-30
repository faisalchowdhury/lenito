import { Types } from "mongoose";

export interface IWorkout extends Document {
  userId: Types.ObjectId;
  bodyShape: string;
  activityLevel: string;
  prefferedWorkout: string;
  goal: string;
  focusArea: string;
  desiredWeight: number;
}
