import { Document, Types } from "mongoose";

export interface IExercise {
  name: string;
  duration: string;
  sets: string;
  calories: string;
  video_url?: string;
  video_status?: string;
}

export interface IWorkoutDay {
  day: string;
  title: string;
  duration: string;
  intensity: string;
  total_calories: string;
  category: string;
  warmup_exercises: IExercise[];
  main_exercises: IExercise[];
  cooldown_exercises: IExercise[];
  // local tracking — not part of the AI response
  status: "not_yet_done" | "done";
}

export interface IIntensityDistribution {
  high: number;
  medium: number;
  low: number;
}

export interface IPlanSummary {
  total_workouts: number;
  total_calories_per_week: number;
  average_duration: string;
  intensity_distribution: IIntensityDistribution;
}

export interface IGeneratedWorkoutPlan extends Document {
  userId: Types.ObjectId;

  // echoed metadata from the AI server
  aiUserId: string;
  blood_type: string;
  age: number;
  bmi: number;
  bmi_category: string;
  body_shape: string;
  activity_level: string;
  main_goal: string;
  workout_level: string;
  focus_areas: string[];

  plan_summary: IPlanSummary;
  weekly_workouts: IWorkoutDay[];

  videos_generated: number;
  videos_cached: number;

  // history / lifecycle tracking
  weekStartDate: Date;
  weekEndDate: Date;
  isActive: boolean;
}
