import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createPlan, getPlans } from "./plan.controller";
import { detectLanguage } from "../../middlewares/language.middleware";

const router = express.Router();

router.post("/create-plan", guardRole(["admin"]), createPlan);

router.get("/plans", guardRole(["admin", "user"]), detectLanguage, getPlans);

export const PlanRoutes = router;
