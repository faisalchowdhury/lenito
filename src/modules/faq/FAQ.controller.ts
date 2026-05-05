import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { addFaqService, allFaqService, deleteFaqService } from "./FAQ.service";

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

export const deleteFaq = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleteFaq = await deleteFaqService(id);
  return sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "FAQ deleted successfully",
    data: deleteFaq,
  });
});
