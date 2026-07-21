// models/Subscription.ts
import mongoose, { Schema } from "mongoose";
import { ISubscription } from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    // Snapshot of plan identity for fast status responses
    planSlug: {
      type: String,
    },
    planName: {
      type: String,
    },

    // Monthly / Yearly
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },

    // Amount charged (snapshot, important if price changes later)
    pricePaid: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "paused"],
      default: "active",
     
    },

    // Dates
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    autoRenew: {
      type: Boolean,
      default: true,
    },

    // ── Native IAP fields ───────────────────────────────────
    platform: {
      type: String,
      enum: ["ios", "android"],
    },
    productId: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    purchaseToken: {
      type: String,
    },
    latestReceipt: {
      type: String,
    },

    paymentProvider: {
      type: String, // "apple", "google", "stripe"
    },

    externalSubscriptionId: {
      type: String,
    },

    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// A user can have only ONE active subscription at a time
subscriptionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

// A store transaction can only ever be recorded once (reject duplicate receipts)
subscriptionSchema.index(
  { transactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionId: { $type: "string" } },
  }
);

export const SubscriptionModel = mongoose.model(
  "Subscription",
  subscriptionSchema
);
