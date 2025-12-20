import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createMeals,
  getCurrentMeals,
  swapMeal,
  updateMealStatus,
} from "./meal.controller";
import { mealAccessControl } from "../../middlewares/accessControl";

const router = express.Router();

router.post(
  "/create-meals",
  guardRole(["user"]),
  mealAccessControl,
  createMeals
);
router.get("/get-meals", guardRole(["user"]), getCurrentMeals);
router.patch("/swap-meal/:mealId", guardRole(["user"]), swapMeal);
router.patch(
  "/update-meal-status/:mealId",
  guardRole(["user"]),
  updateMealStatus
);
export const MealRoutes = router;
