import { Request, Response } from "express";

import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { PlanModel } from "../plan/plan.model";
import { SubscriptionModel } from "./subscription.model";
import sendResponse from "../../utils/sendResponse";
import { billingSummaryService } from "./subscription.service";
import {
  verifyApplePurchase,
  verifyGooglePurchase,
} from "./subscription.verification";
import { IAP_BUNDLE_ID } from "../../config";

// Shape the mobile app expects from verify-purchase + status
const formatStatus = (sub: any | null) => {
  const active = !!sub && sub.status === "active" && sub.endDate > new Date();

  if (!sub || !active) {
    return {
      isSubscribed: false,
      planId: null,
      planSlug: null,
      planName: null,
      billingType: null,
      productId: null,
      transactionId: null,
      expiresAt: null,
      isActive: false,
      autoRenewing: false,
    };
  }

  return {
    isSubscribed: true,
    planId: sub.planId?._id ? sub.planId._id : sub.planId,
    planSlug: sub.planSlug ?? null,
    planName: sub.planName ?? null,
    billingType: sub.billingCycle,
    productId: sub.productId ?? null,
    transactionId: sub.transactionId ?? null,
    expiresAt: sub.endDate,
    isActive: true,
    autoRenewing: !!sub.autoRenew,
  };
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;
    const {
      planId,
      billingCycle, // "monthly" | "yearly"
      paymentProvider,
      externalSubscriptionId,
    } = req.body;

    //  Validate plan
    const plan = await PlanModel.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    //  Check existing active subscription
    const existingSubscription = await SubscriptionModel.findOne({
      userId,
      status: "active",
      endDate: { $gte: new Date() },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "User already has an active subscription",
      });
    }

    //  Determine price
    const pricePaid =
      billingCycle === "yearly"
        ? plan.pricing.yearly.price
        : plan.pricing.monthly.price;

    //  Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    //  Create subscription
    const subscription = await SubscriptionModel.create({
      userId,
      planId: plan._id,
      billingCycle,
      pricePaid,
      currency: "USD",
      status: "active",
      startDate,
      endDate,
      autoRenew: true,
      paymentProvider,
      externalSubscriptionId,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create subscription",
    });
  }
};

export const upgradeSubscription = async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const {
      newPlanId,
      billingCycle, // "monthly" | "yearly"
      paymentProvider,
      externalSubscriptionId,
    } = req.body;

    const now = new Date();

    /**
     *  Find active subscription
     */
    const currentSubscription = await SubscriptionModel.findOne({
      userId,
      status: "active",
      endDate: { $gte: now },
    }).populate("planId");

    if (!currentSubscription) {
      return res.status(400).json({
        success: false,
        message: "No active subscription found",
      });
    }

    const currentPlan: any = currentSubscription.planId;

    /**
     *  Validate new plan
     */
    const newPlan = await PlanModel.findById(newPlanId);
    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({
        success: false,
        message: "New plan not found or inactive",
      });
    }

    /**
     *  Determine prices
     */
    const currentPlanPrice =
      currentSubscription.billingCycle === "yearly"
        ? currentPlan.pricing.yearly.price
        : currentPlan.pricing.monthly.price;

    const newPlanPrice =
      billingCycle === "yearly"
        ? newPlan.pricing.yearly.price
        : newPlan.pricing.monthly.price;

    if (newPlanPrice <= currentPlanPrice) {
      return res.status(400).json({
        success: false,
        message: "Upgrade plan price must be higher than current plan",
      });
    }

    /**
     *  Proration calculation
     */
    const startDate = currentSubscription.startDate;
    const endDate = currentSubscription.endDate;
    const pricePaid = currentSubscription.pricePaid;

    const totalDays = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const usedDays = Math.max(
      0,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const remainingDays = Math.max(0, totalDays - usedDays);

    const pricePerDay = pricePaid / totalDays;
    const remainingValue = remainingDays * pricePerDay;

    const finalPayableAmount = Math.max(0, newPlanPrice - remainingValue);

    /**
     *  Expire old subscription
     */
    currentSubscription.status = "expired";
    currentSubscription.endDate = now;
    await currentSubscription.save();

    /**
     *  Create new subscription
     */
    const newStartDate = now;
    const newEndDate = new Date(now);

    if (billingCycle === "yearly") {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    const newSubscription = await SubscriptionModel.create({
      userId,
      planId: newPlan._id,
      billingCycle,
      pricePaid: finalPayableAmount,
      currency: "USD",
      status: "active",
      startDate: newStartDate,
      endDate: newEndDate,
      autoRenew: true,
      paymentProvider,
      externalSubscriptionId,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription upgraded successfully",
      data: {
        oldPlan: currentPlan.name,
        newPlan: newPlan.name,
        remainingCredit: remainingValue.toFixed(2),
        amountPaid: finalPayableAmount.toFixed(2),
        subscription: newSubscription,
      },
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upgrade subscription",
    });
  }
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const getSubscriptions = await SubscriptionModel.find();

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Subscription plan reterive successfully",
      data: getSubscriptions,
    });
  } catch (err) {
    console.log(err);
  }
};

export const billingSummary = async (req: Request, res: Response) => {
  const billingSummary = await billingSummaryService(req);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Billing summary fetched successfully",
    data: billingSummary,
  });
};

/**
 * API 3 — POST /subscription/verify-purchase
 * Called by mobile right after a successful App Store / Google Play purchase
 * (and on restore). Verifies the receipt/token, then saves the subscription.
 */
export const verifyPurchase = async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const {
      platform, // "ios" | "android"
      planId,
      planSlug,
      billingType, // "monthly" | "yearly"
      productId,
      transactionId,
      purchaseToken,
      receiptData,
    } = req.body;

    // ── Basic input validation ──────────────────────────────
    if (platform !== "ios" && platform !== "android") {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "platform must be 'ios' or 'android'",
      });
    }
    if (billingType !== "monthly" && billingType !== "yearly") {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "billingType must be 'monthly' or 'yearly'",
      });
    }
    if (!planId) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "planId is required",
      });
    }

    // ── Validate plan ───────────────────────────────────────
    const plan = await PlanModel.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Plan not found or inactive",
      });
    }

    // ── Validate productId matches the plan slug ────────────
    // Expected: com.bloodfitltd.bloodfit.{slug}.{monthly|yearly}
    const expectedProductId = `${IAP_BUNDLE_ID}.${plan.slug}.${billingType}`;
    if (productId && productId !== expectedProductId) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `productId does not match plan. Expected ${expectedProductId}`,
      });
    }
    if (planSlug && planSlug !== plan.slug) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `planSlug does not match plan (${plan.slug})`,
      });
    }

    // ── Verify the receipt / token with the store ───────────
    const verification =
      platform === "ios"
        ? await verifyApplePurchase({
            receiptData,
            transactionId,
            productId: productId || expectedProductId,
            billingType,
          })
        : await verifyGooglePurchase({
            purchaseToken,
            productId: productId || expectedProductId,
            transactionId,
            billingType,
          });

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: verification.message || "Invalid or expired receipt",
      });
    }

    const resolvedTxnId =
      verification.transactionId || transactionId || purchaseToken;

    // ── Reject duplicate receipts (idempotent on restore) ───
    if (resolvedTxnId) {
      const existingTxn = await SubscriptionModel.findOne({
        transactionId: resolvedTxnId,
      });
      if (existingTxn) {
        if (String(existingTxn.userId) !== String(userId)) {
          return res.status(409).json({
            success: false,
            status: 409,
            message: "This receipt is already linked to another account",
          });
        }
        // Same user re-sending (restore) → refresh + return current status
        existingTxn.endDate = verification.expiresAt;
        existingTxn.autoRenew = verification.autoRenewing;
        existingTxn.status =
          verification.expiresAt > new Date() ? "active" : "expired";
        existingTxn.purchaseToken = purchaseToken || existingTxn.purchaseToken;
        existingTxn.latestReceipt = receiptData || existingTxn.latestReceipt;
        await existingTxn.save();

        return sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "Subscription verified successfully",
          data: formatStatus(existingTxn),
        });
      }
    }

    const pricePaid =
      billingType === "yearly"
        ? plan.pricing.yearly.price
        : plan.pricing.monthly.price;

    // ── Upsert the user's active subscription ──────────────
    // A user can only have one active subscription (unique index), so update
    // the existing active one if present, otherwise create a new record.
    let subscription = await SubscriptionModel.findOne({
      userId,
      status: "active",
    });

    const fields = {
      userId,
      planId: plan._id,
      planSlug: plan.slug,
      planName: plan.name,
      billingCycle: billingType,
      pricePaid,
      currency: "USD",
      status: "active" as const,
      startDate: new Date(),
      endDate: verification.expiresAt,
      autoRenew: verification.autoRenewing,
      platform,
      productId: productId || expectedProductId,
      transactionId: resolvedTxnId,
      purchaseToken,
      latestReceipt: receiptData,
      paymentProvider: platform === "ios" ? "apple" : "google",
    };

    if (subscription) {
      subscription.set(fields);
      await subscription.save();
    } else {
      subscription = await SubscriptionModel.create(fields);
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Subscription verified successfully",
      data: formatStatus(subscription),
    });
  } catch (error: any) {
    // Duplicate key (race on transactionId unique index)
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: "Duplicate receipt",
      });
    }
    console.error("verifyPurchase error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to verify purchase",
    });
  }
};

/**
 * API 4 — GET /subscription/status
 * Returns the current user's subscription state for unlocking premium.
 */
export const subscriptionStatus = async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const subscription = await SubscriptionModel.findOne({
      userId,
      status: "active",
      endDate: { $gte: new Date() },
    }).sort({ endDate: -1 });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: subscription
        ? "Subscription status fetched"
        : "No active subscription",
      data: formatStatus(subscription),
    });
  } catch (error) {
    console.error("subscriptionStatus error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to fetch subscription status",
    });
  }
};
