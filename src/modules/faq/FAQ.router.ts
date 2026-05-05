import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { addFaq, allFaq, deleteFaq } from "./FAQ.controller";
const router = express.Router();

router.post("/add-faq", guardRole("admin"), addFaq);
router.get("/all-faqs", guardRole(["user", "admin"]), allFaq);
router.delete("/delete-faq/:id", guardRole("admin"), deleteFaq);
export const FaqRoutes = router;
