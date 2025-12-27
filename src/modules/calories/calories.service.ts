import { Request } from "express";
import { CalorieModel } from "./calories.model";

export const addCalorieService = async (data: Request) => {
  const { totalCalorie, carbs, protein, fat } = data.body;

  const caloriePayload = {
    totalCalorie,
    carbs,
    protein,
    fat,
  };
  const addCalorie = await CalorieModel.create(caloriePayload);
  return addCalorie;
};
