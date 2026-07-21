import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createPlan, deletePlan, editPlan, getPlans } from "./plan.controller";
import { detectLanguage } from "../../middlewares/language.middleware";

const router = express.Router();

router.post("/create-plan", guardRole(["admin"]), createPlan);
router.patch("/edit-plan/:id", guardRole(["admin"]), editPlan);

router.get("/plans", guardRole(["admin", "user"]), detectLanguage, getPlans);
router.delete("/delete-plan/:id", guardRole(["admin"]), deletePlan);

export const PlanRoutes = router;
