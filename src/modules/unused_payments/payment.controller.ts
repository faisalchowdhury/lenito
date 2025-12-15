import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { IUserPayload } from "../../middlewares/roleGuard";
import mongoose from "mongoose";
import { UserService } from "../user/user.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { PaymentServices } from "./payment.service";
import { verifyTransaction } from "../../utils/paymentCheck";
import ApiError from "../../errors/ApiError";
import { logger } from "../../logger/logger";

const addPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const paymentId = req.body.paymentId;
  if (!paymentId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment id is required");
  }
  // let query = {
  //   user: new mongoose.Types.ObjectId(user?.id),
  //   // createdAt: { $lte: endDate, $gte: startDate },
  // };

  const data = await verifyTransaction(paymentId);
  //   const result = await PaymentServices.addPayment(query);

  logger.info("Payment verification data:", data);
  const response = {
    id: data?.id,
    paymentMethod: data?.payment_method_types[0] || null,
    currency: data?.currency,
    amount: data?.amount_received / 100,
    status: data?.status,
  };
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment added",
    data: response,
  });
});
export const PaymentController = {
  addPayment,
};
