import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createWorkout, updateWorkoutStatus } from "./workout_plan.controller";
import { accessControl } from "../../middlewares/accessControl";

const router = express.Router();

router.post(
  "/add-workout",
  guardRole(["user"]),
  // {  accessControl({ forWorkout: true }),}
  createWorkout
);
router.patch(
  "/update-workout-status/:workoutPlanId",
  guardRole(["user"]),
  updateWorkoutStatus
);

export const WorkoutPlanRoutes = router;
