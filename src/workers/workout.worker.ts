import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processWorkoutGeneration } from "../modules/workout_plan/workout_plan.service";
import { connectedUsers, io } from "../utils/socket";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
)
  .on("connect", () => {
    console.log("Connected to Redis successfully for workout queue");
  })
  .on("error", (err) => {
    console.error("Redis connection error (workout):", err);
  });

export const workoutWorker = new Worker(
  "workout-generation",
  async (job) => {
    const { userId, aiParams } = job.data;

    console.log(`Processing workout generation for user ${userId}`);

    try {
      const saved = await processWorkoutGeneration({ userId, aiParams });
      console.log(`Workout plan generated successfully for user ${userId}`);
      return saved;
    } catch (error: any) {
      console.error(`Error processing workout generation for user ${userId}:`, {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

workoutWorker.on("completed", async (job) => {
  console.log("Workout job completed:", job.id);

  const { userId } = job.data;
  const result = job.returnvalue;

  const userSocket = connectedUsers.get(userId);

  if (userSocket && io) {
    io.to(userSocket.socketID).emit("workout-generated", {
      jobId: job.id,
      status: "completed",
      data: result,
    });
    console.log(`Sent workout completion notification to user ${userId}`);
  } else {
    console.log(`User ${userId} not connected via socket`);
  }
});

workoutWorker.on("failed", async (job, err) => {
  console.error("Workout job failed:", {
    jobId: job?.id,
    error: err.message,
  });

  const { userId } = job?.data || {};

  const userSocket = connectedUsers.get(userId);

  if (userSocket && io) {
    io.to(userSocket.socketID).emit("workout-generated", {
      jobId: job?.id,
      status: "failed",
      error: err.message,
    });
    console.log(`Sent workout failure notification to user ${userId}`);
  }
});

workoutWorker.on("error", (err) => {
  console.error("Workout worker error:", err);
});
