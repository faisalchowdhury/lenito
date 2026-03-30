import mongoose, { Schema } from "mongoose";
import { IPromocode, IUserPromocode } from "./promocode.interface";

const promocodeSchema: Schema<IPromocode> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    discountedPrice: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const PromocodeModel = mongoose.model<IPromocode>(
  "Promocode",
  promocodeSchema,
);

const userPromocodeSchema: Schema<IUserPromocode> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    promocodeId: {
      type: Schema.Types.ObjectId,
      ref: "Promocode",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// ─────────────────────────────────────────────────────────────
// MODEL
// ─────────────────────────────────────────────────────────────
export const UserPromocodeModel = mongoose.model<IUserPromocode>(
  "UserPromocode",
  userPromocodeSchema,
);
