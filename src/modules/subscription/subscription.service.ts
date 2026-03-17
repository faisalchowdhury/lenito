import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { PlanModel } from "../plan/plan.model";
import {
  PromocodeModel,
  UserPromocodeModel,
} from "../promocode/promocode.model";

export const billingSummaryService = async (req: any) => {
  const { planId } = req.params;
  const { billing } = req.params;

  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  const plan = await PlanModel.findOne({ _id: planId });
  const today = new Date();

  const billingRes: any = {
    planName: plan?.name,
    price: plan?.pricing[billing as keyof typeof plan.pricing].price,
    billing,
    date: today,
    totalPrice: plan?.pricing[billing as keyof typeof plan.pricing].price,
  };

  const isPromocodeActive: any = await UserPromocodeModel.findOne({
    planId,
    userId,
  });

  const isValidPromocode: any = await PromocodeModel.findOne({
    _id: isPromocodeActive.promocodeId,
  });

  if (isPromocodeActive) {
    billingRes.totalPrice =
      billingRes.totalPrice - isValidPromocode.discountedPrice;
  }

  return billingRes;
};
