import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createMeals, getCurrentMeals, swapMeal } from "./meal.controller";

const router = express.Router();

router.post("/create-meals", guardRole(["user"]), createMeals);
router.get("/get-meals", guardRole(["user"]), getCurrentMeals);
router.patch("/swap-meal/:mealId", guardRole(["user"]), swapMeal);
export const MealRoutes = router;
