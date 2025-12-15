import mongoose, { Schema } from "mongoose";
import { TPayment } from "./payment.interface";

const PaymentSchema = new Schema<TPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<TPayment>("Payment", PaymentSchema);
