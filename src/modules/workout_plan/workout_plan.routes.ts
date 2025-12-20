import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createWorkout, updateWorkoutStatus } from "./workout_plan.controller";

const router = express.Router();

router.post("/add-workout", guardRole(["user"]), createWorkout);
router.patch(
  "/update-workout-status/:workoutPlanId",
  guardRole(["user"]),
  updateWorkoutStatus
);

export const WorkoutPlanRoutes = router;
