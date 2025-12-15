import mongoose from "mongoose";

import { IPayment } from "./payment.interface";

const PaymentSchema = new mongoose.Schema<IPayment>({
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  stripeSessionId: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    required: true,
  },
});

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
