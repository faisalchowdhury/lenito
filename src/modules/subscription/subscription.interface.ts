// interfaces/subscription.interface.ts
import { Document, Types } from "mongoose";

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused";

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  planId: Types.ObjectId;

  billingCycle: BillingCycle;

  pricePaid: number;
  currency: string;

  status: SubscriptionStatus;

  startDate: Date;
  endDate: Date;

  autoRenew: boolean;

  paymentProvider?: string; // "stripe" | "razorpay"
  externalSubscriptionId?: string;

  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
