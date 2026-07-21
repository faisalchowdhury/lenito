// interfaces/subscription.interface.ts
import { Document, Types } from "mongoose";

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused";
export type IapPlatform = "ios" | "android";

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  planId: Types.ObjectId;

  // Snapshot of plan identity (so status/verify responses don't need a join)
  planSlug?: string;
  planName?: string;

  billingCycle: BillingCycle;

  pricePaid: number;
  currency: string;

  status: SubscriptionStatus;

  startDate: Date;
  endDate: Date;

  autoRenew: boolean;

  // ── Native IAP (Apple App Store / Google Play) ──────────────
  platform?: IapPlatform;
  productId?: string; // com.bloodfitltd.bloodfit.{slug}.{monthly|yearly}
  transactionId?: string; // Apple original transaction id / Google order id
  purchaseToken?: string; // Google Play purchase token (latest)
  latestReceipt?: string; // Apple base64 receipt (latest)

  paymentProvider?: string; // "apple" | "google" | "stripe"
  externalSubscriptionId?: string;

  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
