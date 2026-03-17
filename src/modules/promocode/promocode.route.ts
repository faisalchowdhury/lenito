import { Router } from "express";
import {
  addPromocode,
  createPromocode,
  deleteManyPromocodes,
  deletePromocode,
  getAllPromocodes,
  getPromocodeById,
  updatePromocode,
  validatePromocode,
} from "./promocode.controller";
import { guardRole } from "../../middlewares/roleGuard";

// import { protect, adminOnly } from "../middlewares/auth.middleware"; // ← plug in your guards

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────

// POST /api/promocodes/validate   → apply a code at checkout
router.post("/validate", validatePromocode);

// ─────────────────────────────────────────────────────────────
// ADMIN / PROTECTED  (uncomment middleware when ready)
// ─────────────────────────────────────────────────────────────

// POST   /api/promocodes            → create
router.post("/", guardRole(["admin"]), createPromocode);

// GET    /api/promocodes            → list all  (?search=XX&page=1&limit=10)
router.get("/", guardRole(["admin"]), getAllPromocodes);

// GET    /api/promocodes/:id        → get one by id
router.get("/:id", guardRole(["admin"]), getPromocodeById);

// PATCH  /api/promocodes/:id        → update
router.patch("/:id", guardRole("admin"), updatePromocode);

// DELETE /api/promocodes/:id        → delete one
router.delete("/:id", guardRole("admin"), deletePromocode);

// DELETE /api/promocodes/bulk       → delete many by ids array
router.delete("/bulk", guardRole("admin"), deleteManyPromocodes);
//
router.post(
  "/add-promocode/:planId/:promocode",
  guardRole("user"),
  addPromocode,
);
export const PromocodeRoutes = router;
