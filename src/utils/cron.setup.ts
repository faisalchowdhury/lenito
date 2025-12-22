// ==================== cron.setup.ts ====================
import cron from "node-cron";
import { runNightlyStreakCheck } from "../modules/streak/streak.service";

/**
 * Schedule nightly streak check at 11:59 PM every day
 */
export function setupStreakCron() {
  // Run at 11:59 PM every day
  cron.schedule("59 23 * * *", async () => {
    console.log("Running scheduled nightly streak check...");
    try {
      await runNightlyStreakCheck();
    } catch (error) {
      console.error("Scheduled streak check failed:", error);
    }
  });

  console.log("Streak cron job scheduled: Every day at 11:59 PM");
}
