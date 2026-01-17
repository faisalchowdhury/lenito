import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { addFaq, allFaq } from "./FAQ.controller";
const router = express.Router();

router.post("/add-faq", guardRole("admin"), addFaq);
router.get("/all-faqs", guardRole("user"), allFaq);

export const FaqRoutes = router;
