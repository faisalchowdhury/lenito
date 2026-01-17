import { Request, Response } from "express";

import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { PlanModel } from "../plan/plan.model";
import { SubscriptionModel } from "./subscription.model";
import sendResponse from "../../utils/sendResponse";

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
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    const usedDays = Math.max(
      0,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
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
