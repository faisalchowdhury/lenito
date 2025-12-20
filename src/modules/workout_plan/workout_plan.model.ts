import mongoose, { Schema } from "mongoose";
import { IWorkoutPlan } from "./workout_plan.interface";

const workoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    workoutName: {
      type: String,
      required: true,
    },

    duration: {
      type: Number, // minutes
      required: true,
    },

    image: {
      type: String,
    },

    focusArea: {
      type: String,
      required: true,
    },

    focusAreaImage: {
      type: String,
    },

    status: {
      type: String,
      enum: ["not_yet_done", "started", "done"],
      default: "done",
    },

    workoutDate: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const WorkoutPlanModel = mongoose.model<IWorkoutPlan>(
  "WorkoutPlan",
  workoutPlanSchema
);
