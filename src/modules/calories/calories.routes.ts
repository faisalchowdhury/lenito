import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  calorieRequirement,
  getCalorieRequirement,
} from "./calories.controller";
const route = express.Router();

route.post(
  "/update-calolie-requirement",
  guardRole(["user"]),
  calorieRequirement,
);

route.get("/calorie-requirement", guardRole(["user"]), getCalorieRequirement);

export const CalorieRoutes = route;
