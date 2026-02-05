import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createHealthdetails,
  getWeightHistory,
  updateHealthDetails,
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
  getWeightHistory,
);
router.patch(
  "/update-health-details",
  guardRole(["user"]),
  // accessControl({ forWorkout: false }),
  updateHealthDetails,
);
export const HealthDetailsRoutes = router;
