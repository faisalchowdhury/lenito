import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { PaymentController } from "./payment.controller";

const router = Router();

router
  .route("/add")
  .post(
    guardRole(["admin", "customer", "barber"]),
    PaymentController.addPayment
  );

export const PaymentRoute = router;
