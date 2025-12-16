import mongoose from "mongoose";
import { IPlan } from "./plan.interface";

const planSchema = new mongoose.Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    description: String,

    pricing: {
      monthly: {
        price: { type: Number, required: true },
      },
      yearly: {
        price: { type: Number, required: true },
      },
    },

    limits: {
      mealsPerWeek: {
        type: Number,
        required: true,
      },
      mealsPerMonth: {
        type: Number,
        required: true,
      },
    },

    features: [
      {
        key: String,
        label: String,
        included: Boolean,
      },
    ],

    isPopular: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const PlanModel = mongoose.model("Plan", planSchema);
