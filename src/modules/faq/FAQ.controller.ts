import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { addFaqService, allFaqService } from "./FAQ.service";

export const addFaq = catchAsync(async (req: Request, res: Response) => {
  const addFaq = await addFaqService(req);

  return sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Faq Added successfully",
    data: addFaq,
  });
});

export const allFaq = catchAsync(async (req: Request, res: Response) => {
  const allFaq = await allFaqService(req);
  return sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "FAQ Retieve successfully",
    data: allFaq,
  });
});
