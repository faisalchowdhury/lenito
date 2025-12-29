import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import sendError from "../../utils/sendError";
import { findUserById } from "../user/user.utils";
import { verifyToken } from "../../utils/JwtToken";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";

import {
  createReportService,
  findSupportId,
  getSingleReportService,
  reportList,
  supportDelete,
  updateReportService,
} from "./report.service";
import { emitNotification } from "../../utils/socket";
import { UserModel } from "../user/user.model";
import mongoose, { Types } from "mongoose";
import ApiError from "../../errors/ApiError";
import paginationBuilder from "../../utils/paginationBuilder";

export const needReport = catchAsync(async (req: Request, res: Response) => {
  let decoded;
  try {
    decoded = verifyToken(req.headers.authorization);
  } catch (error: any) {
    return sendError(res, error);
  }
  const userId = decoded.id as string;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const { message, problem } = req.body;

  if (!message || !problem) {
    return sendError(res, {
      statusCode: httpStatus.BAD_REQUEST,
      message: "Problem and message field are required",
    });
  }

  // Find the user and their role
  const user = await findUserById(userId);
  if (!user) {
    return sendError(res, {
      statusCode: httpStatus.NOT_FOUND,
      message: "User not found.",
    });
  }

  const name = user.firstName;
  const email = user.email;
  await createReportService(name, email, problem, message);

  // Success response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Your Report request has been received. We will review it and get back to you shortly.",

    data: null, // returning the updated user with the supportMsg field updated
  });

  //--------------------------> emit function <-------------------------
  // Define notification messages
  const userMsg =
    "💡 Our support team has received your message and will get back to you shortly. 🚀";

  const primaryMsg = `🌟 A user has requested support:👤Name:${name} ✉️ Email: ${email} `;

  await emitNotification({
    userId: userObjectId, // Pass userId as required by your emitNotification function
    userMsg: userMsg,
    adminMsgTittle: "🔔 **Support Request Alert!**",
    userMsgTittle: "📬 Thank you for reaching out! ",
    adminMsg: primaryMsg,
  });
  //--------------------------> emit function <-------------------------
});

export const getReport = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { support, totalSupport } = await reportList(page, limit);
  const pagination = paginationBuilder({
    totalData: totalSupport,
    currentPage: page,
    limit,
  });
  // Patch: convert null to 0 for prevPage/nextPage to match expected type
  const patchedPagination = {
    ...pagination,
    prevPage: pagination.prevPage ?? 0,
    nextPage: pagination.nextPage ?? 0,
    limit,
    totalItem: pagination.totalData,
  };
  if (support.length === 0) {
    throw new ApiError(400, "No reports found");
  }
  const responseData = support.map((support) => {
    return {
      _id: support._id,
      name: support.name,
      email: support.email,
      msg: support.msg,
      status: support.status,
      createdAt: support.createdAt,
    };
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All reports retrived successfully",
    data: responseData,
    pagination: patchedPagination,
  });
});

export const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const id = req.query?.reportId as string;

  const support = await findSupportId(id);

  if (!support) {
    // return sendError(res, {
    //   statusCode: httpStatus.NOT_FOUND,
    //   message: "support not found .",
    // });
    throw new ApiError(httpStatus.NOT_FOUND, "Report not found .");
  }

  if (support.isDeleted) {
    // return sendError(res, {
    //   statusCode: httpStatus.NOT_FOUND,
    //   message: "This support is  already deleted.",
    // });
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "This report is  already deleted."
    );
  }
  await supportDelete(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "report deleted successfully",
    data: null,
  });
});

export const updateReport = catchAsync(async (req: Request, res: Response) => {
  const updateReport = await updateReportService(req);

  sendResponse(res, {
    statusCode: 400,
    success: false,
    message: "Report status updated successfully",
    data: null,
  });
});

export const getSingleReport = catchAsync(
  async (req: Request, res: Response) => {
    const getSingleReport = await getSingleReportService(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Report reterive successfully",
      data: getSingleReport,
    });
  }
);
