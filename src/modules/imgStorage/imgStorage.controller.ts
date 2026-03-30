import { Request, Response } from "express";
import { ImageStorageModel } from "./imgStorage.model";
import { send } from "node:process";
import sendResponse from "../../utils/sendResponse";

export const getImageFromLocal = async (req: Request, res: Response) => {
  try {
    const { mealIdAi } = req.params;
    const imageData = await ImageStorageModel.findOne({
      mealId: mealIdAi,
    }).lean();
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Image fetched successfully",
      data: imageData,
    });
  } catch (err) {
    console.log(err);
  }
};
