import { Types } from "mongoose";

export interface IPromocode {
  name: string;
  discountedPrice: string;
}

export interface IUserPromocode {
  userId: Types.ObjectId;
  promocodeId: Types.ObjectId;
  planId: Types.ObjectId;
  isValid: boolean;
}
