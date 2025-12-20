import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createSubscription } from "./subscription.controller";
const route = express.Router();

route.post("/create-subscription", guardRole("user"), createSubscription);

export const SubscriptionRoutes = route;
