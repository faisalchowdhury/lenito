import { Request, Response } from "express";

import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { PlanModel } from "../plan/plan.model";
import { SubscriptionModel } from "./subscription.model";

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

    // 1️⃣ Validate plan
    const plan = await PlanModel.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    // 2️⃣ Check existing active subscription
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

    // 3️⃣ Determine price
    const pricePaid =
      billingCycle === "yearly"
        ? plan.pricing.yearly.price
        : plan.pricing.monthly.price;

    // 4️⃣ Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // 5️⃣ Create subscription
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
