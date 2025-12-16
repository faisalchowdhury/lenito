import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { addWorkoutDetails } from "./workout_details.controller";

const router = express.Router();

router.post("/add-workout-details", guardRole(["user"]), addWorkoutDetails);

export const WorkoutRoutes = router;
