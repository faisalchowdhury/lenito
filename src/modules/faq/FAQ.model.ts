import mongoose, { Schema } from "mongoose";
import { IFaq } from "./FAQ.interface";

const faqSchema = new Schema<IFaq>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

export const FAQModel = mongoose.model<IFaq>("Faq", faqSchema);
