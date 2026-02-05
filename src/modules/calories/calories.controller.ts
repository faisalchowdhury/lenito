import cron from "node-cron";
import { UserModel } from "../user/user.model";
import axios from "axios";
import { CalorieModel } from "./calories.model";
import { Request, Response } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import {
  calorieRequirementService,
  getCalorieRequirementService,
} from "./calories.service";

cron.schedule(
  "0 0 0 * * *",
  async () => {
    console.log("Midnight calorie sync started");

    const users = await UserModel.find({}, { _id: 1 });

    for (const user of users) {
      try {
        const apiResponse = await axios.get(`https://test.com/${user._id}`);

        const { totalCalorie, carbs, protein, fat } = apiResponse.data;

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
  },
);

export const calorieRequirement = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const calorieRequirement = await calorieRequirementService(userId);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Calorie requirement fetched successfully",
      data: calorieRequirement,
    });
  },
);

export const getCalorieRequirement = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const getCalorieRequirement = await getCalorieRequirementService(userId);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Calorie requirement fetched successfully",
      data: getCalorieRequirement,
    });
  },
);
