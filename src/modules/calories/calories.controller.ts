import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import cron from "node-cron";
import { UserModel } from "../user/user.model";
import axios from "axios";
import { CalorieModel } from "./calories.model";

cron.schedule(
  "0 0 0 * * *",
  async () => {
    console.log("Midnight calorie sync started");

    const users = await UserModel.find({}, { _id: 1 });

    for (const user of users) {
      try {
        const apiResponse = await axios.get(
          `https://external-api.com/calories/${user._id}`
        );

        const { totalCalorie, carbs, protein, fat } = apiResponse.data;

        // 🔹 SAVE TO DB
        await CalorieModel.create({
          userId: user._id,
          totalCalorie,
          carbs,
          protein,
          fat,
        });
      } catch (error) {
        console.error(` Failed for user ${user._id}`, error);
      }
    }

    console.log(" Midnight calorie sync finished");
  },
  {
    timezone: "Asia/Dhaka",
  }
);
