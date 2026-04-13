// routes/auth.routes.js
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { signup, login, refresh, logout, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { rateLimit } from "express-rate-limit";

const router = Router();

// Rate limit on auth endpoints (50 attempts / 15 min)
const authLimiter = rateLimit({ windowMs:15*60*1000, max:50, message:{ success:false, message:"Too many auth attempts. Please wait 15 minutes." } });

router.post("/signup",  authLimiter, signup);
router.post("/login",   authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout",  logout);
router.get ("/me",      protect, me);

export default router;


