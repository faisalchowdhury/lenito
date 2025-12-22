import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createHealthdetails,
  getWeightHistory,
  updateWeight,
} from "./health_details.controller";
import { accessControl } from "../../middlewares/accessControl";

const router = express.Router();

router.post("/add-health-details", guardRole(["user"]), createHealthdetails);
router.patch("/update-weight", guardRole(["user"]), updateWeight);

router.get(
  "/weight-history",
  guardRole("user"),
  //  { accessControl({ forWorkout: true }),}
  getWeightHistory
);
export const HealthDetailsRoutes = router;
