import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createHealthdetails,
  getHealthDetails,
  getWeightHistory,
  updateHealthDetails,
  updateWeight,
} from "./health_details.controller";
const router = express.Router();

router.post("/add-health-details", guardRole(["user"]), createHealthdetails);
router.get("/health-details", guardRole(["user"]), getHealthDetails);
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
