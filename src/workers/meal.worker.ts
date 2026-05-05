import { Worker } from "bullmq";
import IORedis from "ioredis";
import axios from "axios";
import { HealthDetailsModel } from "../modules/health_details/health_details.model";
import { connectedUsers, io } from "../utils/socket";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
)
  .on("connect", () => {
    console.log("Connected to Redis successfully for bull MQ");
  })
  .on("error", (err) => {
    console.error("Redis connection error:", err);
  });

// Helper function to map goal to activity level
const getActivityLevel = (goal?: string): string => {
  const goalToActivity: Record<string, string> = {
    lose: "moderate",
    "lose weight": "moderate",
    gain: "active",
    "gain muscle": "active",
    maintain: "moderate",
    "maintain weight": "moderate",
    "stay fit": "moderate",
  };

  return goalToActivity[goal?.toLowerCase() || ""] || "moderate";
};

// Helper function to normalize health goals
const getHealthGoal = (goal?: string): string => {
  const goalMap: Record<string, string> = {
    lose: "lose weight",
    gain: "gain muscle",
    maintain: "maintain weight",
    "stay fit": "maintain weight",
  };

  return goalMap[goal?.toLowerCase() || ""] || "maintain weight";
};

export const mealWorker = new Worker(
  "meal-generation",
  async (job) => {
    const { userId } = job.data;

    try {
      console.log(`Processing meal generation for user ${userId}`);

      const health = await HealthDetailsModel.findOne({ userId }).lean();

      if (!health) {
        throw new Error("Health details not found");
      }

      const {
        bloodGroup,
        diet,
        age,
        weight,
        height,
        country,
        goal,
        // Add this field to your model
        foodAllergies = [],
        foodDislikes = [],
      } = health;

      // Validate required fields
      if (!bloodGroup || !diet || !age || !weight || !height) {
        throw new Error("Missing required health details");
      }

      // Determine activity level and health goals

      const healthGoal = getHealthGoal(goal);

      console.log(`Calculating nutrition for user ${userId}:`, {
        health_goals: healthGoal,
      });

      // STEP 1: Calculate daily nutrition
      const calorieResponse = await axios.get(
        `${process.env.AI_SERVER_BASE}/meal/calculate-daily-nutrition`,
        {
          params: {
            user_id: userId,
            blood_type: bloodGroup,
            diet_type: diet,
            age,
            weight,
            height,

            health_goals: healthGoal,
          },
          timeout: 520000, // 520 seconds timeout
        },
      );

      const { total_daily_calories, total_daily_macronutrients } =
        calorieResponse.data;

      console.log(`Nutrition calculated:`, {
        total_daily_calories,
        macronutrients: total_daily_macronutrients,
      });

      // STEP 2: Generate meal plan
      const mealPlanResponse = await axios.get(
        `${process.env.AI_SERVER_BASE}/meal/generate-meal-plan`,
        {
          params: {
            user_id: userId,
            blood_type: bloodGroup,
            diet_type: diet,
            age,
            weight,
            height,
            country,
            food_dislikes: foodDislikes.join(", "),
            allergies: foodAllergies.join(", "),
            total_daily_calories,
            carbs: total_daily_macronutrients.carbohydrates,
            protein: total_daily_macronutrients.protein,
            fat: total_daily_macronutrients.fat,
            main_goal: goal || "Stay Fit",
            language: "en",
            generate_images: true,
          },
          timeout: 520000, // 520 seconds for AI generation
        },
      );

      console.log(`Meal plan generated successfully for user ${userId}`);

      return mealPlanResponse.data;
    } catch (error: any) {
      console.error(`Error processing meal generation for user ${userId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
  },
);

mealWorker.on("completed", async (job) => {
  console.log("Job completed:", job.id);

  const { userId } = job.data;
  const result = job.returnvalue;

  const userSocket = connectedUsers.get(userId);

  if (userSocket && io) {
    io.to(userSocket.socketID).emit("meal-generated", {
      jobId: job.id,
      status: "completed",
      data: result,
    });
    console.log(`Sent completion notification to user ${userId}`);
  } else {
    console.log(`User ${userId} not connected via socket`);
  }
});

mealWorker.on("failed", async (job, err) => {
  console.error("Job failed:", {
    jobId: job?.id,
    error: err.message,
    stack: err.stack,
  });

  const { userId } = job?.data || {};

  const userSocket = connectedUsers.get(userId);

  if (userSocket && io) {
    io.to(userSocket.socketID).emit("meal-generated", {
      jobId: job?.id,
      status: "failed",
      error: err.message,
    });
    console.log(`Sent failure notification to user ${userId}`);
  }
});

mealWorker.on("error", (err) => {
  console.error("Worker error:", err);
});
