import { model, Schema } from "mongoose";
import { IReport } from "./report.interface";

// Define RegisterShowerSchema
const reportSchema = new Schema<IReport>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    problem: { type: String, requard: true },
    msg: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["resolved", "unresolved"],
      default: "unresolved",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create the RegisterShower model
const ReportModel = model<IReport>("report", reportSchema);

export default ReportModel;
