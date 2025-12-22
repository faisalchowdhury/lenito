import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createMeals,
  getCurrentMeals,
  getMeal,
  swapMeal,
  updateMealStatus,
} from "./meal.controller";
import { accessControl } from "../../middlewares/accessControl";

const router = express.Router();

router.post(
  "/create-meals",
  guardRole(["user"]),
  accessControl({ forWorkout: false }),
  createMeals
);
router.get("/get-meals", guardRole(["user"]), getCurrentMeals);
router.patch("/swap-meal/:mealId", guardRole(["user"]), swapMeal);
router.patch(
  "/update-meal-status/:mealId",
  guardRole(["user"]),
  updateMealStatus
);
router.get("/get-meal/:mealId", guardRole(["user"]), getMeal);
export const MealRoutes = router;
