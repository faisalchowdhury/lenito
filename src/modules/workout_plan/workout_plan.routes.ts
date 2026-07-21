import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createWorkout,
  deleteWorkoutPlan,
  checkActiveWorkoutPlan,
  generateWorkout,
  getWorkoutJobStatus,
  getGeneratedWorkoutPlan,
  getWorkoutPlanHistory,
  updateGeneratedDayStatus,
  updateWorkoutStatus,
} from "./workout_plan.controller";
import { accessControl } from "../../middlewares/accessControl";
import upload from "../../multer/multer";

const router = express.Router();

router.post("/generate-workout", guardRole(["user"]), generateWorkout);
router.get(
  "/check-active-plan",
  guardRole(["user"]),
  checkActiveWorkoutPlan
);
router.get("/my-workout-plan", guardRole(["user"]), getGeneratedWorkoutPlan);
router.get("/workout-plan-history", guardRole(["user"]), getWorkoutPlanHistory);
router.get("/workout-status/:jobId", getWorkoutJobStatus);
router.patch(
  "/workout-day-status/:dayId",
  guardRole(["user"]),
  updateGeneratedDayStatus
);

router.post(
  "/add-workout",
  guardRole(["user"]),
  accessControl({ forWorkout: true }),
  upload.any(),
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
