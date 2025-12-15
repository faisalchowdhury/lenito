import express from "express";
import { createCheckoutSession, handlewebhoook } from "./payment.controller";
import userVerification from "../../middlewares/userVerification";

const route = express.Router();

route.post("/create-checkout-session", userVerification, createCheckoutSession);

route.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handlewebhoook
);

export { route };
