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

// export const mealWorker = new Worker(
//   "meal-generation",
//   async (job) => {
//     const { userId } = job.data;

//     console.log(`Processing meal generation for user ${userId}`);
//     const health = await HealthDetailsModel.findOne({ userId }).lean();

//     if (!health) {
//       throw new Error("Health details not found");
//     }

//     const {
//       bloodGroup,
//       diet,
//       age,
//       weight,
//       height,
//       country,
//       foodAllergies = [],
//       foodDislikes = [],
//     } = health;

//     //  STEP 1: Calculate daily nutrition
//     const calorieResponse = await axios.get(
//       `${process.env.AI_SERVER_BASE}/meal/calculate-daily-nutrition`,
//       {
//         params: {
//           user_id: userId,
//           blood_type: bloodGroup,
//           diet_type: diet,
//           age,
//           weight,
//           height,
//           activity_level: "moderate",
//           health_goals: "maintain weight",
//         },
//         timeout: 0,
//       },
//     );

//     const { total_daily_calories, total_daily_macronutrients } =
//       calorieResponse.data;

//     //  STEP 2: Generate meal plan
//     const mealPlanResponse = await axios.get(
//       `${process.env.AI_SERVER_BASE}/meal/generate-meal-plan`,
//       {
//         params: {
//           user_id: userId,
//           blood_type: bloodGroup,
//           diet_type: diet,
//           age,
//           weight,
//           height,
//           country,
//           food_dislikes: foodDislikes.join(","),
//           allergies: foodAllergies.join(","),
//           total_daily_calories,
//           carbs: total_daily_macronutrients.carbohydrates,
//           protein: total_daily_macronutrients.protein,
//           fat: total_daily_macronutrients.fat,
//           main_goal: "Stay Fit",
//           language: "en",
//           generate_images: true,
//         },
//       },
//     );

//     return mealPlanResponse.data;
//   },
//   { connection },
// )
//   .on("completed", (job) => {
//     console.log("Job completed:", job.id);
//     console.log(job);
//   })
//   .on("failed", (job, err) => {
//     console.log("Job failed:", err);
//   })
//   .on("error", (err) => {
//     console.log("Worker error:", err);
//   });

export const mealWorker = new Worker(
  "meal-generation",
  async (job) => {
    const { userId } = job.data;

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
      foodAllergies = [],
      foodDislikes = [],
    } = health;

    // STEP 1: Calculate nutrition
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
          activity_level: health.goal,
          health_goals: "maintain weight",
        },
      },
    );

    const { total_daily_calories, total_daily_macronutrients } =
      calorieResponse.data;

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
          food_dislikes: foodDislikes.join(","),
          allergies: foodAllergies.join(","),
          total_daily_calories,
          carbs: total_daily_macronutrients.carbohydrates,
          protein: total_daily_macronutrients.protein,
          fat: total_daily_macronutrients.fat,
          main_goal: goal,
          language: "en",
          generate_images: true,
        },
      },
    );
    console.log("total..........", total_daily_calories);
    console.log({
      user_id: userId,
      blood_type: bloodGroup,
      diet_type: diet,
      age,
      weight,
      height,
      country,
      food_dislikes: foodDislikes.join(","),
      allergies: foodAllergies.join(","),
      total_daily_calories,
      carbs: total_daily_macronutrients.carbohydrates,
      protein: total_daily_macronutrients.protein,
      fat: total_daily_macronutrients.fat,
      main_goal: goal,
      language: "en",
      generate_images: true,
    });
    return mealPlanResponse.data;
  },
  { connection },
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
  }
});

mealWorker.on("failed", async (job, err) => {
  const { userId } = job?.data || {};

  const userSocket = connectedUsers.get(userId);

  if (userSocket && io) {
    io.to(userSocket.socketID).emit("meal-generated", {
      jobId: job?.id,
      status: "failed",
      error: err.message,
    });
  }
});
