import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { progress } from "./progress.controller";

const router = express.Router();

router.get("/progress-report", guardRole("user"), progress);

export const ProgressRoutes = router;
