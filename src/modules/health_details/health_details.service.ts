import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { HealthDetailsModel } from "./health_details.model";
import ApiError from "../../errors/ApiError";

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

  return health_details;
};

// update weight

export const updateWeightService = async (data: Request) => {
  const user = data.user as JwtPayload;
  const userId = user.id;
  const { weight } = data.body;
  const ifExists = await HealthDetailsModel.findOne({ userId });
  if (!ifExists) {
    throw new ApiError(404, "User health details not found");
  }

  const updateWeight = await HealthDetailsModel.updateOne(
    { userId },
    { weight },
    { new: true }
  );

  return updateWeight;
};
