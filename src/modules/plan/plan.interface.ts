// interfaces/plan.interface.ts
import { Document, Types } from "mongoose";

export interface IPlanFeature {
  key?: string;
  label?: string;
  included?: boolean;
}

export interface IPlanPricing {
  monthly: {
    price: number;
  };
  yearly: {
    price: number;
  };
}

export interface IPlanLimits {
  mealsPerWeek: number;
  mealsPerMonth: number;
}

export interface IPlan extends Document {
  name: string;
  slug: string;
  description?: string;

  pricing: IPlanPricing;

  limits: IPlanLimits;

  features: IPlanFeature[];

  isPopular: boolean;
  isActive: boolean;

  createdBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}
