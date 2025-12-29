import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createWorkout,
  deleteWorkoutPlan,
  updateWorkoutStatus,
} from "./workout_plan.controller";
import { accessControl } from "../../middlewares/accessControl";

const router = express.Router();

router.post(
  "/add-workout",
  guardRole(["user"]),
  accessControl({ forWorkout: true }),
  createWorkout
);
router.patch(
  "/update-workout-status/:workoutPlanId",
  guardRole(["user"]),
  updateWorkoutStatus
);

router.delete(
  "/delete-workout/:workoutPlanId",
  guardRole(["user"]),
  deleteWorkoutPlan
);
export const WorkoutPlanRoutes = router;
