import { Router } from "express";
import {
  calculatePastStreakController,
  checkTodayStreakController,
  createTestDataController,
  getUserStreakController,
  getWeeklyStatusController,
  resetStreakController,
  runNightlyCheckController,
} from "./streak.controller";

const router = Router();
// IMPORTANT: More specific routes MUST come before generic routes
// Admin: Run nightly check (put this BEFORE /:userId routes)
router.post("/admin/nightly-check", runNightlyCheckController);

// TEST ENDPOINTS - Remove these in production
router.post("/test/:userId/create-data", createTestDataController);
router.post("/test/:userId/calculate-past", calculatePastStreakController);
router.delete("/test/:userId/reset", resetStreakController);

// Get weekly status (put this BEFORE /:userId to avoid conflict)
router.get("/:userId/weekly", getWeeklyStatusController);

// Check today's streak (manual trigger) - NOW accepts optional date in body
router.post("/:userId/check", checkTodayStreakController);

// Get user streak (more generic, so put it last)
router.get("/:userId", getUserStreakController);

export const StreakRoutes = router;
