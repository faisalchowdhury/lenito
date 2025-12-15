import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createHealthdetails, updateWeight } from "./health_details.controller";

const router = express.Router();

router.post("/add-health-details", guardRole(["user"]), createHealthdetails);
router.patch("/update-weight", guardRole(["user"]), updateWeight);
export const HealthDetailsRoutes = router;
