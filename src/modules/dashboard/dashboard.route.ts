import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  getAllSubscriptions,
  getBloodGroupStats,
  getRecentSubscriptions,
  getRechartStats,
  getStats,
  getSubscriptionStats,
} from "./dashboard.controller";

const router = express.Router();

router.get("/stats", guardRole("admin"), getStats);
router.get("/subscriber-list", guardRole("admin"), getAllSubscriptions);
router.get("/subscription-stats", guardRole("admin"), getSubscriptionStats);
router.get("/blood-group-stats", guardRole("admin"), getBloodGroupStats);
router.get(
  "/get-recent-subscription",
  guardRole("admin"),
  getRecentSubscriptions,
);
router.get("/get-rechart-stats", guardRole("admin"), getRechartStats);

export const DashboardRoutes = router;
