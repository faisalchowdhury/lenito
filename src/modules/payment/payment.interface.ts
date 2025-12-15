export type IPayment = {
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: "pending" | "completed" | "failed";
};
