// routes/analytics.routes.js
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { getSummary, getMonthly, getCategories, getTrends } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect);

router.get("/summary",    getSummary);    // ?year=2024&month=4
router.get("/monthly",    getMonthly);    // ?year=2024
router.get("/categories", getCategories); // ?year=2024&month=4
router.get("/trends",     getTrends);     // ?months=6

export default router;


