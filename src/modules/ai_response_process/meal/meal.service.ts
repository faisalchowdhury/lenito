import axios from "axios";
import { Request } from "express";
import { HealthDetailsModel } from "../../health_details/health_details.model";
import { JwtPayloadWithUser } from "../../../middlewares/userVerification";
import { WorkoutModel } from "../../workout_details/workout_details.model";

export const generateMealsService = async (req: Request) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

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
      foodAllergies = [],
      foodDislikes = [],
    } = health;

    //  STEP 1: Calculate daily nutrition
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
          activity_level: "moderate",
          health_goals: "maintain weight",
        },
        timeout: 0,
      },
    );

    const { total_daily_calories, total_daily_macronutrients } =
      calorieResponse.data;

    //  STEP 2: Generate meal plan
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
          language: "en",
        },
      },
    );

    return mealPlanResponse.data;
  } catch (error) {
    console.error(" generateMealsService error:", error);
    throw error;
  }
};

export const calorieIntakeService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  const health = await HealthDetailsModel.findOne({ userId });

  if (!health) {
    throw new Error("Health details not found");
  }

  const { bloodGroup, diet, age, weight, height } = health;

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
        activity_level: "moderate",
        health_goals: "maintain weight",
      },
      timeout: 10000,
    },
  );
  console.log(calorieResponse.data);
  return calorieResponse.data;
};

export const generateMealImageService = async (req: Request) => {
  try {
    const payload = req.body;

    const imageGenerateEndpoint = `${process.env.AI_SERVER_BASE}/meal/generate-meal-images`;

    const mealImage = await axios.post(imageGenerateEndpoint, payload);

    return mealImage.data;
  } catch (err) {
    console.log(err);
  }
};

export const scanFoodService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  //  Health details
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
    foodAllergies = [],
    foodDislikes = [],
  } = health;

  // Image from multer (food scan needs image)

  console.log(".............................", req.file);
  if (!req.file) {
    throw new Error("Food image is required");
  }

  // 🔹 Build AI endpoint
  const endpoint = `${process.env.AI_SERVER_BASE}/meal/scan-food`;

  // 🔹 Call AI server
  const response = await axios.post(
    endpoint,
    {
      user_id: userId,
      blood_type: bloodGroup,
      diet_type: diet,
      age,
      weight,
      height,
      country,
      allergies: foodAllergies,
      food_dislikes: foodDislikes,
      language: "en",
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // If AI server expects image
      data: {
        image: req.file,
      },
      timeout: 15000,
    },
  );

  return response.data;
};
