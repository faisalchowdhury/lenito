import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { HealthDetailsModel, WeightHistoryModel } from "./health_details.model";
import ApiError from "../../errors/ApiError";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";

// add health details service
export const healthDetailsService = async (data: Request) => {
  const user = data.user as JwtPayload;
  const userId = user.id;

  const ifExists = await HealthDetailsModel.findOne({ userId });

  if (ifExists) {
    throw new ApiError(400, "Healthe details already added for this user");
  }

  const {
    bloodGroup,
    gender,
    age,
    weight,
    height,
    diet,
    foodAllergies,
    foodDislikes,
  } = data.body;

  const healthDetailsPayload = {
    userId,
    bloodGroup,
    gender,
    age,
    weight,
    height,
    diet,
    foodAllergies,
    foodDislikes,
  };

  const health_details = await HealthDetailsModel.create(healthDetailsPayload);

  if (!health_details) {
    throw new ApiError(400, "Creation failed");
  }
  await WeightHistoryModel.create({
    userId,
    weight,
    date: new Date(),
  });

  return health_details;
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
  await HealthDetailsModel.updateOne({ userId }, { weight }, { new: true });

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
