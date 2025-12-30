import mongoose, { Schema } from "mongoose";
import { IWorkout } from "./workout_details.interface";

const workoutSchema = new Schema<IWorkout>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bodyShape: {
    type: String,
    enum: ["medium", "flabby", "skinny", "muscular"],
    required: true,
  },
  activityLevel: {
    type: String,
    required: true,
  },
  prefferedWorkout: {
    type: String,
    enum: ["easy", "light_sweat", "challenging"],
    required: true,
  },
  goal: {
    type: String,
    enum: ["lose_weight", "gain_muscle", "stay_fit"],
    required: true,
  },
  focusArea: {
    type: String,
    enum: ["arms", "upper_body", "abs", "butt", "legs"],
    required: true,
  },
  desiredWeight: {
    type: Number,
    required: true,
  },
});

export const WorkoutModel = mongoose.model<IWorkout>(
  "WorkoutDetails",
  workoutSchema
);
