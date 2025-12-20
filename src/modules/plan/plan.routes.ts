import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createPlan, getPlans } from "./plan.controller";

const router = express.Router();

router.post("/create-plan", guardRole(["admin"]), createPlan);

router.get("/plans", guardRole(["admin", "user"]), getPlans);

export const PlanRoutes = router;
