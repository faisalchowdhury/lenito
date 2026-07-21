import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  billingSummary,
  createSubscription,
  getSubscriptions,
  subscriptionStatus,
  upgradeSubscription,
  verifyPurchase,
} from "./subscription.controller";
const route = express.Router();

route.post("/create-subscription", guardRole("user"), createSubscription);
route.post("/upgrade-plan", guardRole("user"), upgradeSubscription);
route.get("/plans", guardRole("user"), getSubscriptions);
route.get("/billing/:planId/:billing", guardRole("user"), billingSummary);

// Native IAP (Apple App Store / Google Play)
route.post("/verify-purchase", guardRole("user"), verifyPurchase);
route.get("/status", guardRole("user"), subscriptionStatus);

export const SubscriptionRoutes = route;
