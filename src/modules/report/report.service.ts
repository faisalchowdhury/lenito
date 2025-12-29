import httpStatus from "http-status";
import reportModel from "./report.model";
import ApiError from "../../errors/ApiError";
import { IReport } from "./report.interface";
import ReportModel from "./report.model";
import { Request } from "express";

export const createReportService = async (
  name: string | undefined,
  email: string,
  problem: string,
  msg: string
) => {
  try {
    const createdReport = await ReportModel.create({
      name,
      email,
      problem,
      msg,
    });

    return createdReport;
  } catch (error: any) {
    // console.error(error, "---------->>");
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message =
      error.message || "An error occurred while submitting the support msg.";
    throw new ApiError(statusCode, message);
  }
};

export const reportList = async (
  page: number,
  limit: number

  //search?: string,
) => {
  const skip = (page - 1) * limit;
  const filter: any = { isDeleted: false };

  const support = await ReportModel.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // Sort by most recent

  const totalSupport = await ReportModel.countDocuments(filter);
  const totalPages = Math.ceil(totalSupport / limit);

  return { support, totalSupport, totalPages };
};

export const findSupportId = async (id: string): Promise<IReport | null> => {
  return ReportModel.findById(id);
};

export const supportDelete = async (id: string): Promise<void> => {
  await ReportModel.findByIdAndUpdate(id, {
    isDeleted: true,
  });
};

export const updateReportService = async (data: Request) => {
  const { reportId } = data.params;

  const updateReport = await ReportModel.findOneAndUpdate(
    { _id: reportId },
    { status: "resolved" },
    {
      new: true,
    }
  );

  return updateReport;
};

export const getSingleReportService = async (data: Request) => {
  const { reportId } = data.params;

  const getSingleReport = await ReportModel.findOne({ _id: reportId });
  if (!getSingleReport) {
    throw new ApiError(400, "Report not found");
  }
  return getSingleReport;
};
