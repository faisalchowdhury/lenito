import stripe from "../../utils/stripe";
import { Request, Response } from "express";
import { PaymentModel } from "./payment.model";
import Stripe from "stripe";
import { UserModel } from "../user/user.model";
const createCheckoutSession = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Lifetime Subscriprion",
            },
            unit_amount: 5000 * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://google.com",
      cancel_url: "https://facebook.com",
      metadata: { userId },
    });

    await PaymentModel.create({
      userId,
      stripeSessionId: session.id,
      amount: 5000,
      currency: "USD",
      status: "pending",
    });
    await UserModel.findByIdAndUpdate(userId, { paymentStatus: true });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ err });
  }
};

const handlewebhoook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event | undefined;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return res.status(400).send(err.message);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    await PaymentModel.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: "paid" }
    );
  }

  res.json({ received: true });
};

export { createCheckoutSession, handlewebhoook };
