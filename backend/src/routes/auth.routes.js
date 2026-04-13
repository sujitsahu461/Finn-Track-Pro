// routes/auth.routes.js
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { signup, login, refresh, logout, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { rateLimit } from "express-rate-limit";

const router = Router();

// Stricter rate limit on auth endpoints (5 attempts / 15 min)
const authLimiter = rateLimit({ windowMs:15*60*1000, max:5, message:{ success:false, message:"Too many auth attempts." } });

router.post("/signup",  authLimiter, signup);
router.post("/login",   authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout",  logout);
router.get ("/me",      protect, me);

export default router;


