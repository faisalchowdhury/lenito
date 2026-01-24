import axios from "axios";
import { JwtPayloadWithUser } from "../../../middlewares/userVerification";
import { Request } from "express";
import { HealthDetailsModel } from "../../health_details/health_details.model";
import { IHealth_details } from "../../health_details/health_details.interface";

export const generateMealsService = async (data: Request) => {
  try {
    const user = data.user as JwtPayloadWithUser;
    const userId = user.id;
    console.log(userId);
    let fetchHealthDetails: any = await HealthDetailsModel.findOne({
      userId,
    }).lean();

    console.log(fetchHealthDetails);
    const {
      bloodGroup,
      diet,
      age,
      weight,
      height,
      country,
      foodAllergies,
      foodDislikes,
    } = fetchHealthDetails;

    const endpoint = `${process.env.AI_SERVER_BASE}/meal/generate-meal-plan?user_id=${userId}&blood_type=${bloodGroup}&diet_type=${diet}&age=${age}&weight=${weight}&height=170&country=${country}&food_dislikes=${foodDislikes.map((food: string) => food + ",")}&allergies=${foodAllergies.map((allergie: string) => allergie + ",")}&total_daily_calories=2200&carbs=275&protein=110&fat=73&language=en`;
    console.log(endpoint);
    const result = await axios.get(endpoint);
    return result.data;
  } catch (err) {
    console.log(err);
  }
};
