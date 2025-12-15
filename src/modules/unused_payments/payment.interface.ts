import { Document, Types } from "mongoose";

export type TPayment = {
  user: Types.ObjectId;
  transactionId: string;
  amount: number;
  status: string;
} & Document;
