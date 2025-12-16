import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createPlan } from "./plan.controller";

const router = express.Router();

router.post("/create-plan", guardRole(["admin"]), createPlan);

export const PlanRoutes = router;
