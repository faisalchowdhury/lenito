import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { getImageFromLocal } from "./imgStorage.controller";

const router = express.Router();

router.get("/local-image/:mealIdAi", guardRole("user"), getImageFromLocal);

export const ImageStorageRoutes = router;
