import express from "express";

import { guardRole } from "../../middlewares/roleGuard";
import {
  deleteReport,
  getReport,
  getSingleReport,
  needReport,
  updateReport,
} from "./report.controller";

const router = express.Router();
router.post("/create-report", needReport);
//router.post("/update", guardRole("primary"), updateCategory);

router.get("/", guardRole(["admin"]), getReport);
router.post("/delete", guardRole(["admin"]), deleteReport);
router.patch("/update-status/:reportId", guardRole(["admin"]), updateReport);
router.get(
  "/get-single-report/:reportId",
  guardRole(["admin"]),
  getSingleReport
);
export const ReportRoutes = router;
