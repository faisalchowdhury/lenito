import { Request, Response, NextFunction } from "express";
import { JwtPayloadWithUser } from "./userVerification";

import { MealModel } from "../modules/meal/meal.model";

import { SubscriptionModel } from "../modules/subscription/subscription.model";

export const accessControl = (options?: { forWorkout?: boolean }) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const user = req.user as JwtPayloadWithUser;
      const userId = user.id;
      const today = new Date();

      /**
       *  FIND ACTIVE SUBSCRIPTION
       */
      const subscription = await SubscriptionModel.findOne({
        userId,
        status: "active",
        endDate: { $gte: today },
      }).populate("planId");

      if (!subscription) {
        if (options?.forWorkout) {
          return res.status(403).json({
            success: false,
            message:
              "You need an active subscription to create a workout plan.",
          });
        } else {
          const totalMeals = await MealModel.countDocuments({ userId });
          if (totalMeals >= 1) {
            return res.status(403).json({
              success: false,
              message:
                "Free users can create only one meal plan. Please upgrade.",
            });
          }
          return next();
        }
      }

      const plan: any = subscription.planId;

      if (!plan?.limits) {
        return res.status(500).json({
          success: false,
          message: "Subscription plan limits not configured.",
        });
      }

      // ---------------- WORKOUT PLAN CHECK ----------------
      if (options?.forWorkout) {
        if (plan.name.toLowerCase() !== "elite") {
          return res.status(403).json({
            success: false,
            message: "Only Elite plan users can create workout plans.",
          });
        }
      }

      // ---------------- MEAL PLAN CHECKS (UNCHANGED) ----------------
      const mealsPerWeek = plan.limits.mealsPerWeek;
      const mealsPerMonth = plan.limits.mealsPerMonth;

      const weekStart = new Date(today);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(today.getDate() - today.getDay());

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const weeklyUsedDays = await MealModel.distinct("planDate", {
        userId,
        planDate: { $gte: weekStart, $lte: weekEnd },
      });

      if (!options?.forWorkout && weeklyUsedDays.length >= mealsPerWeek) {
        return res.status(403).json({
          success: false,
          message: "Weekly meal plan limit reached.",
        });
      }

      const monthlyUsedDays = await MealModel.distinct("planDate", {
        userId,
        planDate: { $gte: monthStart, $lte: monthEnd },
      });

      if (!options?.forWorkout && monthlyUsedDays.length >= mealsPerMonth) {
        return res.status(403).json({
          success: false,
          message: "Monthly meal plan limit reached.",
        });
      }

      req.subscription = subscription;

      next();
    } catch (error) {
      console.error("Access control error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to verify access permissions.",
      });
    }
  };
};
