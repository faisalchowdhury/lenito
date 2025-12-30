import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { progress, weightProgress } from "./progress.controller";

const router = express.Router();

router.get("/progress-report", guardRole("user"), progress);

router.get("/weight-progress", guardRole(["user"]), weightProgress);

export const ProgressRoutes = router;
