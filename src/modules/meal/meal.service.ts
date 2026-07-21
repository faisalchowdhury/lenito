import { Request } from "express";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { MealModel } from "./meal.model";
import ApiError from "../../errors/ApiError";
import uniqid from "uniqid";
import { Types } from "mongoose";
import dayjs from "dayjs";
import { MealUsageModel } from "../meal_usage/meal_usage.model";
import { translateText } from "../../services/translate.service";
import axios from "axios";
import { HealthDetailsModel } from "../health_details/health_details.model";

// create meal service
// previous logic
// export const createMealService = async (req: Request) => {
//   const { date, meals } = req.body;
//   const user = req.user as JwtPayloadWithUser;
//   const subscription = (req as any).subscription;

//   const dateStr = dayjs(date).format("YYYY-MM-DD");

//   // ---- DATE VALIDATION (DO NOT REMOVE EXISTING LOGIC) ----
//   const todayStr = dayjs().format("YYYY-MM-DD");

//   //  Prevent previous day planning
//   if (dayjs(dateStr).isBefore(todayStr)) {
//     throw new ApiError(400, "You cannot plan meals for previous days");
//   }

//   //  Prevent planning outside subscription period
//   if (subscription) {
//     const subStart = dayjs(subscription.startDate).format("YYYY-MM-DD");
//     const subEnd = dayjs(subscription.endDate).format("YYYY-MM-DD");

//     if (dayjs(dateStr).isBefore(subStart)) {
//       throw new ApiError(
//         400,
//         "You cannot plan meals before your subscription start date"
//       );
//     }

//     if (dayjs(dateStr).isAfter(subEnd)) {
//       throw new ApiError(
//         400,
//         "Your subscription has expired. Please renew to plan meals"
//       );
//     }
//   }

//   const userId = user.id;

//   const weeklyLimit = subscription?.planId?.limits?.mealsPerWeek ?? 1;
//   const monthlyLimit = subscription?.planId?.limits?.mealsPerMonth ?? 4;

//   // Selected meals for the day
//   const selectedMeals = Object.keys(meals).filter(
//     (m) => Array.isArray(meals[m]) && meals[m].length > 0
//   );
//   if (selectedMeals.length === 0) throw new ApiError(400, "No meals selected");

//   // --- Find or create usage record ---
//   let usage = await MealUsageModel.findOne({ userId });
//   if (!usage) {
//     usage = new MealUsageModel({ userId, mealPlans: [] });
//   }

//   // --- Check weekly limit ---
//   const weekStart = dayjs(date).startOf("week").format("YYYY-MM-DD");
//   const weekEnd = dayjs(date).endOf("week").format("YYYY-MM-DD");

//   const weeklyPlans = usage.mealPlans.filter(
//     (p) => p.planDate >= weekStart && p.planDate <= weekEnd
//   );

//   if (weeklyPlans.length >= weeklyLimit) {
//     throw new ApiError(
//       403,
//       `Weekly meal plan limit reached (${weeklyLimit} days)`
//     );
//   }

//   // --- Check monthly limit ---
//   const monthStart = dayjs(date).startOf("month").format("YYYY-MM-DD");
//   const monthEnd = dayjs(date).endOf("month").format("YYYY-MM-DD");

//   const monthlyPlans = usage.mealPlans.filter(
//     (p) => p.planDate >= monthStart && p.planDate <= monthEnd
//   );

//   if (monthlyPlans.length >= monthlyLimit) {
//     throw new ApiError(
//       403,
//       `Monthly meal plan limit reached (${monthlyLimit} days)`
//     );
//   }

//   // --- Prevent duplicate meal plan for same day ---
//   const existingPlan = usage.mealPlans.find((p) => p.planDate === dateStr);
//   if (existingPlan)
//     throw new ApiError(400, "Meal plan for this day already exists");

//   // --- Add new meal plan ---
//   usage.mealPlans.push({ planDate: dateStr, meals: selectedMeals });
//   await usage.save();

//   // --- Create MealModel documents ---
//   const mealGroupId = uniqid();
//   const mealDocs: any[] = [];

//   for (const mealType of selectedMeals) {
//     const mealList = meals[mealType];
//     for (const meal of mealList) {
//       const caloryCount = Array.isArray(meal.caloryCount)
//         ? meal.caloryCount.map((i: any) => ({ label: i.label, kcal: i.kcal }))
//         : [];
//       const totalKcal = caloryCount.reduce(
//         (sum: number, i: any) => sum + i.kcal,
//         0
//       );

//       mealDocs.push({
//         userId,
//         mealGroupId,
//         planDate: dateStr,
//         mealType,
//         description: meal.description,
//         ingredients: meal.ingredients || [],
//         caloryCount,
//         date,
//         kcal: totalKcal,
//       });
//     }
//   }

//   const savedMeals = await MealModel.insertMany(mealDocs);
//   return savedMeals;
// };

const normalizePath = (path: string) =>
  path.replace(/\\/g, "/").replace("public", "");

// export const createMealService = async (req: Request) => {
//   const user = req.user as JwtPayloadWithUser;
//   const subscription = (req as any).subscription;

//   const userId = user.id;

//   // 🔹 meals comes as STRING from form-data
//   const meals =
//     typeof req.body.meals === "string"
//       ? JSON.parse(req.body.meals)
//       : req.body.meals;

//   const date = req.body.date;
//   const dateStr = dayjs(date).format("YYYY-MM-DD");
//   const todayStr = dayjs().format("YYYY-MM-DD");

//   // ---------------- FILES ----------------
//   const files = req.files as {
//     breakfastImage?: Express.Multer.File[];
//     lunchImage?: Express.Multer.File[];
//     dinnerImage?: Express.Multer.File[];
//   };

//   const imageMap: Record<string, string | null> = {
//     breakfast: files?.breakfastImage?.[0]?.path
//       ? normalizePath(files.breakfastImage[0].path)
//       : null,

//     lunch: files?.lunchImage?.[0]?.path
//       ? normalizePath(files.lunchImage[0].path)
//       : null,

//     dinner: files?.dinnerImage?.[0]?.path
//       ? normalizePath(files.dinnerImage[0].path)
//       : null,
//   };

//   // ---------------- DATE VALIDATION ----------------
//   if (dayjs(dateStr).isBefore(todayStr)) {
//     throw new ApiError(400, "You cannot plan meals for previous days");
//   }

//   if (subscription) {
//     const subStart = dayjs(subscription.startDate).format("YYYY-MM-DD");
//     const subEnd = dayjs(subscription.endDate).format("YYYY-MM-DD");

//     if (dayjs(dateStr).isBefore(subStart)) {
//       throw new ApiError(
//         400,
//         "You cannot plan meals before your subscription start date"
//       );
//     }

//     if (dayjs(dateStr).isAfter(subEnd)) {
//       throw new ApiError(
//         400,
//         "Your subscription has expired. Please renew to plan meals"
//       );
//     }
//   }

//   // ---------------- PLAN LIMITS ----------------
//   const weeklyLimit = subscription?.planId?.limits?.mealsPerWeek ?? 1;
//   const monthlyLimit = subscription?.planId?.limits?.mealsPerMonth ?? 4;

//   // ---------------- SELECTED MEALS ----------------
//   const ALLOWED_MEALS = ["breakfast", "lunch", "dinner"] as const;
//   type MealType = (typeof ALLOWED_MEALS)[number];

//   const selectedMeals: MealType[] = Object.keys(meals).filter(
//     (m): m is MealType =>
//       ALLOWED_MEALS.includes(m as MealType) &&
//       Array.isArray(meals[m]) &&
//       meals[m].length > 0
//   );

//   if (selectedMeals.length === 0) {
//     throw new ApiError(400, "No meals selected");
//   }

//   // ---------------- MEAL USAGE ----------------
//   let usage = await MealUsageModel.findOne({ userId });
//   if (!usage) {
//     usage = new MealUsageModel({ userId, mealPlans: [] });
//   }

//   const existingPlan = usage.mealPlans.find((p) => p.planDate === dateStr);
//   if (existingPlan) {
//     throw new ApiError(400, "Meal plan for this day already exists");
//   }

//   // ---------------- WEEKLY LIMIT ----------------
//   const weekStart = dayjs(dateStr).startOf("week").format("YYYY-MM-DD");
//   const weekEnd = dayjs(dateStr).endOf("week").format("YYYY-MM-DD");

//   const weeklyPlans = usage.mealPlans.filter(
//     (p) => p.planDate >= weekStart && p.planDate <= weekEnd
//   );

//   const weeklyMealCount = weeklyPlans.reduce(
//     (sum, p) => sum + (p.mealCount ?? p.meals.length),
//     0
//   );

//   if (weeklyMealCount + selectedMeals.length > weeklyLimit) {
//     throw new ApiError(403, `Weekly meal limit reached (${weeklyLimit})`);
//   }

//   // ---------------- MONTHLY LIMIT ----------------
//   const monthStart = dayjs(dateStr).startOf("month").format("YYYY-MM-DD");
//   const monthEnd = dayjs(dateStr).endOf("month").format("YYYY-MM-DD");

//   const monthlyPlans = usage.mealPlans.filter(
//     (p) => p.planDate >= monthStart && p.planDate <= monthEnd
//   );

//   const monthlyMealCount = monthlyPlans.reduce(
//     (sum, p) => sum + (p.mealCount ?? p.meals.length),
//     0
//   );

//   if (monthlyMealCount + selectedMeals.length > monthlyLimit) {
//     throw new ApiError(403, `Monthly meal limit reached (${monthlyLimit})`);
//   }

//   // ---------------- SAVE USAGE ----------------
//   usage.mealPlans.push({
//     planDate: dateStr,
//     meals: selectedMeals,
//     mealCount: selectedMeals.length,
//   });

//   await usage.save();

//   // ---------------- CREATE MEALS ----------------
//   const mealGroupId = uniqid();
//   const mealDocs: any[] = [];

//   for (const mealType of selectedMeals) {
//     for (const meal of meals[mealType]) {
//       const caloryCount = Array.isArray(meal.caloryCount)
//         ? meal.caloryCount.map((i: any) => ({
//             label: i.label,
//             kcal: i.kcal,
//           }))
//         : [];

//       const totalKcal = caloryCount.reduce(
//         (sum: number, i: any) => sum + i.kcal,
//         0
//       );

//       mealDocs.push({
//         userId,
//         mealGroupId,
//         planDate: dateStr,
//         mealType,
//         description: meal.description,
//         ingredients: meal.ingredients || [],
//         caloryCount,
//         image: imageMap[mealType], // ✅ LOCAL IMAGE PATH
//         date,
//         kcal: totalKcal,
//       });
//     }
//   }

//   const savedMeals = await MealModel.insertMany(mealDocs);
//   return savedMeals;
// };

// get current date meals service

// export const getCurrentMealsService = async (req: Request) => {
//   try {
//     const user = req.user as JwtPayloadWithUser;
//     const userId = user.id;

//     const today = dayjs().format("YYYY-MM-DD");

//     // Fetch meals for today
//     const meals = await MealModel.find({ userId, date: today });

//     // Map meals by type (single object per type)
//     const mealPlan: Record<string, any | null> = {
//       breakfast: null,
//       lunch: null,
//       dinner: null,
//     };

//     meals.forEach((meal) => {
//       mealPlan[meal.mealType] = meal;
//     });

//     return mealPlan;
//   } catch (error) {
//     throw error;
//   }
// };

// export const getCurrentMealsService = async (req: any) => {
//   try {
//     const user = req.user as JwtPayloadWithUser;
//     const userId = user.id;
//     const lang = req.headers["accept-language"] || "en";

//     const today = dayjs().format("YYYY-MM-DD");

//     // Fetch meals for today
//     const meals = await MealModel.find({ userId, date: today }).lean();

//     // Default response structure
//     const mealPlan: Record<string, any | null> = {
//       breakfast: null,
//       lunch: null,
//       dinner: null,
//     };

//     for (const meal of meals) {
//       const mealAny: any = meal;
//       const translatedMeal: any = { ...mealAny };

//       //  Translate only text fields
//       if (lang !== "en") {
//         if (mealAny.description) {
//           translatedMeal.description = await translateText(
//             mealAny.description,
//             lang
//           );
//         }

//         if (mealAny.mealName) {
//           translatedMeal.mealName = await translateText(mealAny.mealName, lang);
//         }

//         if (Array.isArray(mealAny.ingredients)) {
//           translatedMeal.ingredients = await Promise.all(
//             mealAny.ingredients.map((item: string) => translateText(item, lang))
//           );
//         }
//       }

//       mealPlan[mealAny.mealType] = translatedMeal;
//     }

//     return mealPlan;
//   } catch (error) {
//     throw error;
//   }
// };
export const createMealService = async (req: any) => {
  const user = req.user as JwtPayloadWithUser;
  const subscription = req.subscription;
  const lang = req.lang || "en";
  const current = req.query?.current || false;
  const userId = user.id;

  // meals comes as STRING from form-data
  const meals =
    typeof req.body.meals === "string"
      ? JSON.parse(req.body.meals)
      : req.body.meals;

  const date = req.body.date;
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const todayStr = dayjs().format("YYYY-MM-DD");

  const dateData = current ? dayjs().format("YYYY-MM-DD") : date;

  // ---------------- FILES ----------------

  const files = req.files as {
    breakfastImage?: Express.Multer.File[];
    lunchImage?: Express.Multer.File[];
    dinnerImage?: Express.Multer.File[];
  };

  const imageMap: Record<string, string | null> = {
    breakfast: files?.breakfastImage?.[0]?.path
      ? normalizePath(files.breakfastImage[0].path)
      : null,
    lunch: files?.lunchImage?.[0]?.path
      ? normalizePath(files.lunchImage[0].path)
      : null,
    dinner: files?.dinnerImage?.[0]?.path
      ? normalizePath(files.dinnerImage[0].path)
      : null,
  };

  // ---------------- DATE VALIDATION ----------------
  if (dayjs(dateStr).isBefore(todayStr)) {
    throw new ApiError(400, "You cannot plan meals for previous days");
  }

  // ---------------- PLAN LIMITS ----------------
  const weeklyLimit = subscription?.planId?.limits?.mealsPerWeek ?? 3;
  const monthlyLimit = subscription?.planId?.limits?.mealsPerMonth ?? 12;

  // ---------------- SELECTED MEALS ----------------
  const ALLOWED_MEALS = ["breakfast", "lunch", "dinner"] as const;
  type MealType = (typeof ALLOWED_MEALS)[number];

  const selectedMeals: MealType[] = Object.keys(meals).filter(
    (m): m is MealType =>
      ALLOWED_MEALS.includes(m as MealType) &&
      Array.isArray(meals[m]) &&
      meals[m].length > 0,
  );

  if (!selectedMeals.length) {
    throw new ApiError(400, "No meals selected");
  }

  // ----------------  NORMALIZE INPUT TO ENGLISH ----------------
  if (lang !== "en") {
    for (const mealType of selectedMeals) {
      for (const meal of meals[mealType]) {
        if (meal.description) {
          meal.description = await translateText(meal.description, "en");
        }

        if (Array.isArray(meal.ingredients)) {
          meal.ingredients = await Promise.all(
            meal.ingredients.map((i: string) => translateText(i, "en")),
          );
        }

        // if (Array.isArray(meal.caloryCount)) {
        //   for (const c of meal.caloryCount) {
        //     c.label = await translateText(c.label, "en");
        //   }
        // }
      }
    }
  }

  // ---------------- CREATE MEALS ----------------
  const mealGroupId = uniqid();
  const mealDocs: any[] = [];

  for (const mealType of selectedMeals) {
    for (const meal of meals[mealType]) {
      const caloryCount = meal.caloryCount || [];
      const totalKcal = caloryCount.reduce(
        (sum: number, i: any) => sum + i.kcal,
        0,
      );

      mealDocs.push({
        userId,
        mealName: meal.mealName,
        mealGroupId,
        planDate: dateStr,
        mealType,
        description: meal.description,
        ingredients: meal.ingredients || [],
        caloryCount,
        image: imageMap[mealType],
        date: dateData,
        serving: meal.serving,
        kcal: totalKcal,
      });
    }
  }

  const savedMeals = await MealModel.insertMany(mealDocs);

  // ----------------  TRANSLATE RESPONSE ----------------
  if (lang !== "en") {
    for (const meal of savedMeals) {
      meal.description = await translateText(meal.description, lang);

      if (Array.isArray(meal.ingredients)) {
        meal.ingredients = await Promise.all(
          meal.ingredients.map((i: string) => translateText(i, lang)),
        );
      }

      if (Array.isArray(meal.caloryCount)) {
        for (const c of meal.caloryCount) {
          c.label = await translateText(c.label, lang);
        }
      }
    }
  }

  return savedMeals;
};

export const getCurrentMealsService = async (req: any) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;
    const lang = req.lang || "en";

    const today = dayjs().format("YYYY-MM-DD");

    const meals = await MealModel.find({ userId, date: today }).lean();

    const mealPlan: Record<string, any | null> = {
      breakfast: null,
      lunch: null,
      dinner: null,
    };

    for (const meal of meals) {
      const translatedMeal = { ...meal };

      if (lang !== "en") {
        if (meal.description) {
          translatedMeal.description = await translateText(
            meal.description,
            lang,
          );
        }

        // Translate ingredients array
        // if (Array.isArray(meal.ingredients)) {
        //   translatedMeal.ingredients = await Promise.all(
        //     meal.ingredients.map((item: string) => translateText(item, lang)),
        //   );
        // }
      }

      mealPlan[meal.mealType] = translatedMeal;
    }

    return meals;
  } catch (error) {
    throw error;
  }
};

// recent meal chosen
export const myRecentMeals = async (req: any) => {
  try {
    const mealType = req.params.mealType;
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;
    const lang = req.lang || "en";

    const meals = await MealModel.find({ userId, mealType })
      .limit(2)
      .sort({ createdAt: -1 })
      .lean();

    // const mealPlans: any[] = [];

    // for (const meal of meals) {
    //   const translatedMeal: any = {
    //     ...meal,
    //     mealType: meal.mealType, // explicitly included
    //   };

    //   if (lang !== "en") {
    //     if (meal.description) {
    //       translatedMeal.description = await translateText(
    //         meal.description,
    //         lang,
    //       );
    //     }

    //     if (Array.isArray(meal.ingredients)) {
    //       translatedMeal.ingredients = await Promise.all(
    //         meal.ingredients.map((item: string) => translateText(item, lang)),
    //       );
    //     }
    //   }

    //   mealPlans.push(translatedMeal);
    // }

    return meals;
  } catch (error) {
    throw error;
  }
};

// swap meal Options

export const swapMealOptionsService = async (req: any) => {
  try {
    const { category, sub_category, current_calories } = req.query;

    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;

    const health: any = await HealthDetailsModel.findOne({ userId });
    const params = {
      user_id: userId,
      blood_type: health.bloodGroup,
      diet_type: health.diet,
      category,
      sub_category,
      current_calories,
      country: health.country,
      food_dislike: health.foodDislikes.join(","),
      allergies: health.foodAllergies.join(","),
      language: "en",
      generate_images: true,
    };
    console.log(params);
    const response = await axios.get(
      `${process.env.AI_SERVER_BASE}/meal/swap-meal`,
      {
        params,
      },
    );

    return response.data;
  } catch (err: any) {
    console.error("Swap meal error:", err?.response?.data || err.message);
    throw err;
  }
};

// swap meal

export const swapMealService = async (req: any) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;
  const lang = req.lang || "en";
  const { mealId } = req.params;

  if (!mealId) {
    throw new ApiError(400, "Meal Id is required");
  }

  // ---------------- PARSE MEAL DATA ----------------
  // meal comes as STRING from form-data
  const mealData =
    typeof req.body.meal === "string"
      ? JSON.parse(req.body.meal)
      : req.body.meal;

  if (!mealData) {
    throw new ApiError(400, "Meal data is required");
  }

  // ---------------- IMAGE (OPTIONAL) ----------------
  const file = req.file as Express.Multer.File | undefined;
  const imagePath = file ? normalizePath(file.path) : undefined;

  // ---------------- NORMALIZE INPUT TO ENGLISH ----------------
  if (lang !== "en") {
    if (mealData.description) {
      mealData.description = await translateText(mealData.description, "en");
    }

    // Translate ingredient names
    if (Array.isArray(mealData.ingredients)) {
      mealData.ingredients = await Promise.all(
        mealData.ingredients.map(async (ingredient: any) => ({
          ...ingredient,
          name: await translateText(ingredient.name, "en"),
          quantity: await translateText(ingredient.quantity, "en"),
        })),
      );
    }

    // Translate calory count labels
    if (Array.isArray(mealData.caloryCount)) {
      for (const c of mealData.caloryCount) {
        c.label = await translateText(c.label, "en");
      }
    }
  }

  // ---------------- CALCULATE KCAL ----------------
  const caloryCount = mealData.caloryCount || [];
  const totalKcal = caloryCount.reduce(
    (sum: number, item: any) => sum + item.kcal,
    0,
  );

  // ---------------- UPDATE PAYLOAD ----------------
  const swapMealPayload: any = {
    mealName: mealData.mealName,
    description: mealData.description,
    ingredients: Array.isArray(mealData.ingredients)
      ? mealData.ingredients
      : [],
    caloryCount,
    kcal: totalKcal,
    serving: mealData.serving,
  };

  if (imagePath) {
    swapMealPayload.image = imagePath;
  }

  // ---------------- UPDATE ----------------
  const swappedMeal = await MealModel.findOneAndUpdate(
    { _id: mealId, userId },
    { $set: swapMealPayload },
    { new: true },
  );

  if (!swappedMeal) {
    throw new ApiError(404, "Meal not found or you do not have permission");
  }

  // ---------------- TRANSLATE RESPONSE ----------------
  if (lang !== "en") {
    swappedMeal.description = await translateText(
      swappedMeal.description,
      lang,
    );

    // Translate ingredient names back to user language
    if (Array.isArray(swappedMeal.ingredients)) {
      swappedMeal.ingredients = await Promise.all(
        swappedMeal.ingredients.map(async (ingredient: any) => ({
          ...ingredient,
          name: await translateText(ingredient.name, lang),
          quantity: await translateText(ingredient.quantity, lang),
        })),
      );
    }

    // Translate calory count labels back to user language
    if (Array.isArray(swappedMeal.caloryCount)) {
      for (const c of swappedMeal.caloryCount) {
        c.label = await translateText(c.label, lang);
      }
    }
  }

  return swappedMeal;
};

export const updateMealStatusService = async (data: Request) => {
  try {
    const { mealId } = data.params;

    const checkStatus = await MealModel.findOne({ _id: mealId });

    if (!checkStatus) {
      throw new ApiError(400, "Meal not found");
    } else if (checkStatus?.status === "done") {
      throw new ApiError(400, "This meal is already completed");
    }

    const updateStatus = await MealModel.updateOne(
      { _id: mealId },
      { status: "done" },
    );

    return updateStatus;
  } catch (err) {
    console.log(err);
  }
};

// export const getMealService = async (data: Request) => {
//   const { mealId } = data.params;

//   const getMeal = await MealModel.findOne({ _id: mealId });

//   if (!getMeal) {
//     throw new ApiError(400, "Meal not found");
//   }

//   return getMeal;
// };

export const getMealService = async (req: any) => {
  try {
    const { mealId } = req.params;
    const lang = req.lang || "en";

    const meal = await MealModel.findOne({ _id: mealId }).lean();

    if (!meal) {
      throw new ApiError(400, "Meal not found");
    }

    // ---------------- TRANSLATION ----------------
    if (lang !== "en") {
      // description
      if (meal.description) {
        meal.description = await translateText(meal.description, lang);
      }

      // ingredients
      // if (Array.isArray(meal.ingredients)) {
      //   meal.ingredients = await Promise.all(
      //     meal.ingredients.map((item: string) => translateText(item, lang)),
      //   );
      // }

      // caloryCount labels
      if (Array.isArray(meal.caloryCount)) {
        meal.caloryCount = await Promise.all(
          meal.caloryCount.map(async (c: any) => ({
            ...c,
            label: c.label ? await translateText(c.label, lang) : c.label,
          })),
        );
      }
    }

    return meal;
  } catch (err) {
    console.log(err);
  }
};

export const deleteMealService = async (data: Request) => {
  try {
    const { mealId } = data.params;

    const deleteMeal = await MealModel.deleteOne({ _id: mealId });

    return deleteMeal;
  } catch (err) {
    console.log(err);
  }
};

// export const createSingleMealService = async (req: Request) => {
//   const user = req.user as JwtPayloadWithUser;
//   const userId = user.id;
//   const { mealGroupId } = req.params;
//   const { meal } = req.body;

//   if (!mealGroupId) {
//     throw new ApiError(400, "Meal Group Id is required");
//   }

//   if (!meal || typeof meal !== "object") {
//     throw new ApiError(400, "Meal data is required");
//   }

//   // Determine which mealType is being added (breakfast, lunch, dinner)
//   const mealTypes = ["breakfast", "lunch", "dinner"] as const;
//   let selectedMealType: (typeof mealTypes)[number] | null = null;

//   for (const type of mealTypes) {
//     if (meal[type] !== undefined) {
//       selectedMealType = type;
//       break;
//     }
//   }

//   if (!selectedMealType) {
//     throw new ApiError(
//       400,
//       "No valid meal type found (breakfast, lunch, dinner)"
//     );
//   }

//   const mealData = meal[selectedMealType];

//   if (!mealData.description || !mealData.caloryCount) {
//     throw new ApiError(400, "Meal must include description and caloryCount");
//   }

//   // Check if this mealType already exists in the mealGroup
//   const existingMeal = await MealModel.findOne({
//     mealGroupId,
//     mealType: selectedMealType,
//   });
//   if (existingMeal) {
//     throw new ApiError(
//       400,
//       `${selectedMealType} already exists in this meal group`
//     );
//   }

//   // Get the date from any existing meal in this mealGroupId
//   const groupMeal = await MealModel.findOne({ mealGroupId });
//   const mealDate = groupMeal ? groupMeal.date : new Date();

//   // Build meal payload
//   const newMeal = new MealModel({
//     userId,
//     mealGroupId,
//     mealType: selectedMealType,
//     description: mealData.description,
//     ingredients: mealData.ingredients || [],
//     caloryCount: mealData.caloryCount,
//     kcal: mealData.caloryCount.reduce(
//       (sum: number, item: { label: string; kcal: number }) => sum + item.kcal,
//       0
//     ),
//     date: mealDate,
//   });

//   await newMeal.save();

//   return newMeal;
// };

export const createSingleMealService = async (req: Request) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;
    const { mealGroupId } = req.params;

    if (!mealGroupId) {
      throw new ApiError(400, "Meal Group Id is required");
    }

    // ---------------- GET DATE FROM DB (FIX) ----------------
    const groupMeal: any = await MealModel.findOne({
      mealGroupId,
      userId,
    }).lean();

    if (!groupMeal) {
      throw new ApiError(404, "Meal group not found");
    }

    const planDate = dayjs(groupMeal.date).format("YYYY-MM-DD");

    if (!planDate) {
      throw new ApiError(500, "Meal group date is missing");
    }

    const today = dayjs().format("YYYY-MM-DD");

    if (dayjs(planDate).isBefore(today)) {
      throw new ApiError(400, "You cannot update meals for previous days");
    }

    // ---------------- MEAL DATA ----------------
    const meal =
      typeof req.body.meal === "string"
        ? JSON.parse(req.body.meal)
        : req.body.meal;

    if (!meal || typeof meal !== "object") {
      throw new ApiError(400, "Meal data is required");
    }

    // ---------------- IMAGE ----------------
    const file = req.file as Express.Multer.File | undefined;
    const imagePath = file ? normalizePath(file.path) : null;

    // ---------------- DETECT MEAL TYPE ----------------
    const mealTypes = ["breakfast", "lunch", "dinner"] as const;
    type MealType = (typeof mealTypes)[number];

    let selectedMealType: MealType | null = null;

    for (const type of mealTypes) {
      if (meal[type]) {
        selectedMealType = type;
        break;
      }
    }

    if (!selectedMealType) {
      throw new ApiError(
        400,
        "No valid meal type found (breakfast, lunch, dinner)",
      );
    }

    const mealData = meal[selectedMealType];

    if (!mealData.description || !Array.isArray(mealData.caloryCount)) {
      throw new ApiError(400, "Meal must include description and caloryCount");
    }

    // ---------------- MEAL USAGE VALIDATION ----------------
    const usage = await MealUsageModel.findOne({ userId });

    if (!usage) {
      throw new ApiError(
        400,
        "Meal usage not found. Create a meal plan first.",
      );
    }

    const planForDate = usage.mealPlans.find((p) => p.planDate === planDate);

    if (!planForDate) {
      throw new ApiError(400, "Meal plan for this date does not exist");
    }

    if (planForDate.meals.includes(selectedMealType)) {
      throw new ApiError(
        400,
        `${selectedMealType} already exists for ${planDate}`,
      );
    }

    // ---------------- UPDATE USAGE (ANTI-DUPLICATE LOCK) ----------------
    planForDate.meals.push(selectedMealType);
    planForDate.mealCount = (planForDate.mealCount || 0) + 1;

    await usage.save();

    // ---------------- CALCULATE KCAL ----------------
    const totalKcal = mealData.caloryCount.reduce(
      (sum: number, item: { label: string; kcal: number }) => sum + item.kcal,
      0,
    );

    // ---------------- CREATE MEAL ----------------
    const newMeal = await MealModel.create({
      userId,
      mealGroupId,
      planDate, // optional, keep for consistency
      mealType: selectedMealType,
      description: mealData.description,
      ingredients: mealData.ingredients || [],
      caloryCount: mealData.caloryCount,
      kcal: totalKcal,
      image: imagePath,
      date: planDate,
    });

    return newMeal;
  } catch (err) {
    console.log(err);
  }
};

// calendar progress for the current month (or a requested month)
// returns one entry per day of the month with the meal-completion percentage
export const getMealCalendarProgressService = async (req: any) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  // optional ?year=2026&month=6 (1-based month) for calendar navigation,
  // otherwise default to the current month
  const now = dayjs();
  const year = Number(req.query?.year) || now.year();
  const month = Number(req.query?.month) || now.month() + 1; // 1-based

  if (month < 1 || month > 12) {
    throw new ApiError(400, "month must be between 1 and 12");
  }

  const monthIndex = month - 1; // 0-based for Date.UTC
  const daysInMonth = dayjs(
    `${year}-${String(month).padStart(2, "0")}-01`,
  ).daysInMonth();

  // stored meal dates are at UTC midnight, so match the month in UTC
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  const grouped = await MealModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" },
        },
        total: { $sum: 1 },
        done: {
          $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] },
        },
      },
    },
  ]);

  const byDate = new Map<string, { total: number; done: number }>(
    grouped.map((g: any) => [g._id, { total: g.total, done: g.done }]),
  );

  const calendar = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = byDate.get(dateStr);
    const total = entry?.total ?? 0;
    const done = entry?.done ?? 0;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    calendar.push({
      day: dayjs(dateStr).format("dddd"), // weekday name e.g. "Tuesday"
      dayNumber: d, // 1-30/31
      date: dateStr, // YYYY-MM-DD
      totalMeals: total,
      completedMeals: done,
      percentage, // 0-100
    });
  }

  return {
    year,
    month,
    daysInMonth,
    calendar,
  };
};

export const getMealsByDateService = async (req: any) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;
    const date = req.body.date;

    if (!date) {
      throw new ApiError(400, "Date is required");
    }

    const dateStr = dayjs(date).format("YYYY-MM-DD");

    const meals = await MealModel.find({ userId, date: dateStr });

    return meals;
  } catch (err) {
    console.log(err);
  }
};
