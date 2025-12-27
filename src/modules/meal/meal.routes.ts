import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createMeals,
  createSingleMeal,
  deleteMeal,
  getCurrentMeals,
  getMeal,
  swapMeal,
  updateMealStatus,
} from "./meal.controller";
import { accessControl } from "../../middlewares/accessControl";
import upload from "../../multer/multer";

const router = express.Router();

router.post(
  "/create-meals",
  guardRole(["user"]),
  accessControl({ forWorkout: false }),
  upload.fields([
    { name: "breakfastImage", maxCount: 1 },
    { name: "lunchImage", maxCount: 1 },
    { name: "dinnerImage", maxCount: 1 },
  ]),
  createMeals
);
router.get("/get-meals", guardRole(["user"]), getCurrentMeals);
router.patch(
  "/swap-meal/:mealId",
  guardRole(["user"]),
  upload.single("image"),
  swapMeal
);
router.patch(
  "/update-meal-status/:mealId",
  guardRole(["user"]),
  updateMealStatus
);
router.get("/get-meal/:mealId", guardRole(["user"]), getMeal);

router.delete("/delete-meal/:mealId", guardRole(["user"]), deleteMeal);
router.post(
  "/create-single-meal/:mealGroupId",
  guardRole(["user"]),
  createSingleMeal
);

export const MealRoutes = router;
