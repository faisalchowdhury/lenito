import mongoose from "mongoose";
import { IImgStorage } from "./imgStorage.interface";

const imgStorageSchema = new mongoose.Schema<IImgStorage>({
  mealId: { type: String, required: true },
  imgRef: { type: String, required: true },
});

export const ImageStorageModel = mongoose.model<IImgStorage>(
  "ImageStorage",
  imgStorageSchema,
);
