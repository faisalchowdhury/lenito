import { Types } from "mongoose";

export interface IWorkoutPlan extends Document {
  userId: Types.ObjectId;
  workoutName: string;
  duration: number; // milliseconds
  image: string;
  focusArea: string;
  focusAreaImage: string;
  status: string;
  workoutDate: Date;
}
