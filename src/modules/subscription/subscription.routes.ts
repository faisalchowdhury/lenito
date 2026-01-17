import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createSubscription,
  getSubscriptions,
  upgradeSubscription,
} from "./subscription.controller";
const route = express.Router();

route.post("/create-subscription", guardRole("user"), createSubscription);
route.post("/upgrade-plan", guardRole("user"), upgradeSubscription);
route.get("/plans", guardRole("user"), getSubscriptions);
export const SubscriptionRoutes = route;
