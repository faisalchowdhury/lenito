import mongoose, { Schema } from "mongoose";
import { IGeneratedWorkoutPlan } from "./generated_workout.interface";

// A single exercise (used in warmup / main / cooldown lists)
const ExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    duration: { type: String },
    sets: { type: String },
    calories: { type: String },
    video_url: { type: String },
    video_status: { type: String },
  },
  { _id: false },
);

// One day of the weekly plan
const WorkoutDaySchema = new Schema(
  {
    day: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: String },
    intensity: { type: String },
    total_calories: { type: String },
    category: { type: String },
    warmup_exercises: { type: [ExerciseSchema], default: [] },
    main_exercises: { type: [ExerciseSchema], default: [] },
    cooldown_exercises: { type: [ExerciseSchema], default: [] },
    status: {
      type: String,
      enum: ["not_yet_done", "done"],
      default: "not_yet_done",
    },
  },
  { _id: true },
);

const PlanSummarySchema = new Schema(
  {
    total_workouts: { type: Number },
    total_calories_per_week: { type: Number },
    average_duration: { type: String },
    intensity_distribution: {
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const generatedWorkoutPlanSchema = new Schema<IGeneratedWorkoutPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // metadata echoed back by the AI server
    aiUserId: { type: String },
    blood_type: { type: String },
    age: { type: Number },
    bmi: { type: Number },
    bmi_category: { type: String },
    body_shape: { type: String },
    activity_level: { type: String },
    main_goal: { type: String },
    workout_level: { type: String },
    focus_areas: { type: [String], default: [] },

    plan_summary: { type: PlanSummarySchema },
    weekly_workouts: { type: [WorkoutDaySchema], default: [] },

    videos_generated: { type: Number, default: 0 },
    videos_cached: { type: Number, default: 0 },

    // history / lifecycle tracking
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const GeneratedWorkoutPlanModel = mongoose.model<IGeneratedWorkoutPlan>(
  "GeneratedWorkoutPlan",
  generatedWorkoutPlanSchema,
);
