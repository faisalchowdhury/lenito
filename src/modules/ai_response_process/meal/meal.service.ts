import axios from "axios";
import { Request } from "express";
import { HealthDetailsModel } from "../../health_details/health_details.model";
import { JwtPayloadWithUser } from "../../../middlewares/userVerification";
import { WorkoutModel } from "../../workout_details/workout_details.model";
import sendResponse from "../../../utils/sendResponse";
import { mealQueue } from "../../../queues/meal.queues";
import { UserModel } from "../../user/user.model";
import FormData from "form-data";
import { ImageStorageModel } from "../../imgStorage/imgStorage.model";

// export const generateMealsService = async (req: Request) => {
//   try {
//     const user = req.user as JwtPayloadWithUser;
//     const userId = user.id;

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
//   } catch (error) {
//     console.error(" generateMealsService error:", error);
//     throw error;
//   }
// };

export const generateMealsService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;

  const job = await mealQueue.add("generate-meal", {
    userId: user.id,
  });

  return {
    jobId: job.id,
    status: "processing",
  };
};

export const calorieIntakeService = async (req: Request) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const health = await HealthDetailsModel.findOne({ userId });

    if (!health) {
      throw new Error("Health details not found");
    }
    console.log(health.goal);
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
          health_goals: health.goal,
        },
        timeout: 10000,
      },
    );
    console.log(calorieResponse.data);
    return calorieResponse.data;
  } catch (err: any) {
    console.log(err.message);
  }
};

export const generateMealImageService = async (req: Request) => {
  try {
    const payload = req.body;

    const imageGenerateEndpoint = `${process.env.AI_SERVER_BASE}/meal/generate-meal-images`;

    const mealImage = await axios.post(imageGenerateEndpoint, payload);

    const isExist = await ImageStorageModel.findOne({
      mealId: req.params.mealIdAi,
    });

    if (!isExist) {
      const mealId = req.params.mealIdAi;
      const imgRef = mealImage.data.meal_image_base64;

      await ImageStorageModel.create({
        mealId: req.params.mealIdAi,
        imgRef,
      });
    }

    return mealImage.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const scanFoodService = async (req: Request) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  const health = await HealthDetailsModel.findOne({ userId }).lean();
  if (!health) {
    throw new Error("Health details not found");
  }

  const {
    bloodGroup,
    diet,
    country,
    foodAllergies = [],
    foodDislikes = [],
  } = health;

  if (!req.file) {
    throw new Error("Food image is required");
  }

  const formData = new FormData();
  formData.append("image", req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    knownLength: req.file.size,
  });

  const endpoint = `${process.env.AI_SERVER_BASE}/meal/scan-food`;

  const response = await axios.post(endpoint, formData, {
    params: {
      user_id: userId,
      blood_type: bloodGroup,
      diet_type: diet,
      country: country,
      allergies: foodAllergies.join(", "),
      food_dislikes: foodDislikes.join(", "),
      language: "en",
    },
    headers: {
      ...formData.getHeaders(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 0,
  });

  return response.data;
};
