import { Request } from "express";
import { FAQModel } from "./FAQ.model";

export const addFaqService = async (data: Request) => {
  const { question, answer } = data.body;

  const payload = {
    question,
    answer,
  };

  const addFaq = await FAQModel.create(payload);
  return addFaq;
};

export const allFaqService = async (data: Request) => {
  const getFaq = await FAQModel.find();
  return getFaq;
};
