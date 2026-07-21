import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { HealthDetailsModel, WeightHistoryModel } from "./health_details.model";
import ApiError from "../../errors/ApiError";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { UserModel } from "../user/user.model";
import { calorieRequirementService } from "../calories/calories.service";
import httpStatus from "http-status";
import mongoose from "mongoose";

// add health details service
export const healthDetailsService = async (req: Request) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user as JwtPayload;
    const userId = user.id;

    const exists = await HealthDetailsModel.findOne({ userId }).session(
      session,
    );
    if (exists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Health details already added for this user",
      );
    }

    const {
      bloodGroup,
      gender,
      age,
      country,
      weight,
      height,
      goal,
      desiredWeight,
      diet,
      foodAllergies,
      foodDislikes,
    } = req.body;

    const healthDetails = await HealthDetailsModel.create(
      [
        {
          userId,
          bloodGroup,
          gender,
          age,
          country,
          weight,
          height,
          goal,
          desiredWeight,
          diet,
          foodAllergies,
          foodDislikes,
        },
      ],
      { session },
    );

    await UserModel.findByIdAndUpdate(
      userId,
      { healthDetails: true },
      { new: true, session },
    );

    await WeightHistoryModel.create(
      [
        {
          userId,
          weight,
          date: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    //  Fire-and-forget (do NOT block main flow)
    calorieRequirementService(userId).catch((err) => {
      console.error("Calorie service failed:", err.message);
    });

    return {
      ...healthDetails[0].toObject(),
      healthDetails: true,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof ApiError) throw error;

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create health details",
    );
  }
};

// update weight

export const updateWeightService = async (data: Request) => {
  const user = data.user as JwtPayload;
  const userId = user.id;
  const { weight } = data.body;

  if (!weight || weight <= 0) {
    throw new ApiError(400, "Invalid weight value");
  }

  //  Check if user health details exist
  const healthDetails = await HealthDetailsModel.findOne({ userId });
  if (!healthDetails) {
    throw new ApiError(404, "User health details not found");
  }

  //  Update the user's current weight
  await HealthDetailsModel.findOneAndUpdate({ userId }, { weight }, { new: true });

  //  Record weight history
  await WeightHistoryModel.create({
    userId,
    weight,
    date: new Date(),
  });

  return { success: true, message: "Weight updated and history recorded" };
};

// get health details service

export const getWeightHistoryService = async (data: Request) => {
  const user = data.user as JwtPayloadWithUser;

  const history = await WeightHistoryModel.find({ userId: user.id })
    .sort({ date: 1 }) // ascending order for timeline
    .lean();

  return history;
};

// get health details service
export const getHealthDetailsService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  const healthDetails = await HealthDetailsModel.findOne({ userId }).lean();

  if (!healthDetails) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Health details not found for this user",
    );
  }

  return healthDetails;
};

export const updateHealthDetailsService = async (req: Request) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const existingHealth = await HealthDetailsModel.findOne({ userId }).session(
      session,
    );

    if (!existingHealth) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Health details not found for this user",
      );
    }

    const {
      bloodGroup,
      gender,
      age,
      country,
      weight,
      height,
      goal,
      desiredWeight,
      diet,
      foodAllergies,
      foodDislikes,
      cheatDay,
    } = req.body;

    const updatedHealth = await HealthDetailsModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(bloodGroup && { bloodGroup }),
          ...(gender && { gender }),
          ...(age && { age }),
          ...(country && { country }),
          ...(weight && { weight }),
          ...(height && { height }),
          ...(goal && { goal }),
          ...(desiredWeight && { desiredWeight }),
          ...(diet && { diet }),
          ...(foodAllergies && { foodAllergies }),
          ...(foodDislikes && { foodDislikes }),
          ...(cheatDay && { cheatDay }),
        },
      },
      { new: true, session },
    );

    // If weight is updated → store history
    if (weight && weight !== existingHealth.weight) {
      await WeightHistoryModel.create(
        [
          {
            userId,
            weight,
            date: new Date(),
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    // Fire-and-forget calorie recalculation
    calorieRequirementService(userId).catch((err) => {
      console.error("Calorie service failed:", err.message);
    });

    return updatedHealth;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof ApiError) throw error;

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update health details",
    );
  }
};
