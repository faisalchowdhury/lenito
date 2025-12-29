import mongoose, { Document } from "mongoose";
export type IReport = {
  name: string;
  email: string;
  problem: string;
  msg: string;
  status: string;
  createdAt: Date;
  isDeleted: boolean;
} & Document;
