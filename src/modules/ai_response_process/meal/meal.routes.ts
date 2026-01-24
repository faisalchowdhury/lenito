import express from "express";
import { guardRole } from "../../../middlewares/roleGuard";
import { getMeals } from "./meal.controller";
import { accessControl } from "../../../middlewares/accessControl";
const route = express.Router();

route.get("/get-meals-plans", guardRole("user"), accessControl(), getMeals);

export const AiMealRoutes = route;
