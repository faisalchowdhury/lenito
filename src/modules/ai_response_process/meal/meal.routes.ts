import express from "express";
import { guardRole } from "../../../middlewares/roleGuard";
import {
  calorieIntake,
  generateMealImage,
  getMeals,
  scanFood,
} from "./meal.controller";
import { accessControl } from "../../../middlewares/accessControl";
import upload from "../../../multer/multer";
const route = express.Router();

route.get("/get-meals-plans", guardRole("user"), getMeals);
route.get("/daily-calorie-intake", guardRole("user"), calorieIntake);
route.post("/generate-meal-image", guardRole("user"), generateMealImage);
route.post("/scan-food", guardRole("user"), upload.single("image"), scanFood);

export const AiMealRoutes = route;
