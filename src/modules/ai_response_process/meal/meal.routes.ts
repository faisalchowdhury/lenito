import express from "express";
import { guardRole } from "../../../middlewares/roleGuard";
import {
  calorieIntake,
  generateMealImage,
  getMealJobStatus,
  getMeals,
  scanFood,
} from "./meal.controller";
import { accessControl } from "../../../middlewares/accessControl";
import upload, { memoryUpload } from "../../../multer/multer";
const route = express.Router();

route.get("/get-meals-plans", guardRole("user"), getMeals);
route.get("/daily-calorie-intake", guardRole("user"), calorieIntake);
route.post(
  "/generate-meal-image/:mealIdAi",
  guardRole("user"),
  generateMealImage,
);
route.post(
  "/scan-food",
  guardRole("user"),
  memoryUpload.single("image"),
  scanFood,
);

route.get("/meal-status/:jobId", getMealJobStatus);
export const AiMealRoutes = route;
