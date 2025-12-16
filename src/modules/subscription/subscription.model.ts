// models/Subscription.ts
import mongoose, { Schema } from "mongoose";
import { ISubscription } from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
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
      index: true,
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

    paymentProvider: {
      type: String, // "stripe", "razorpay"
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

export default mongoose.model("Subscription", subscriptionSchema);
