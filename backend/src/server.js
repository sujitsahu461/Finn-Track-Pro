/**
 * FinTrack Pro — Backend API Server
 * Node.js + Express + JWT + PostgreSQL (via Prisma)
 *
 * Architecture:
 *   src/
 *     server.js          ← Entry point (this file)
 *     routes/
 *       auth.routes.js
 *       transactions.routes.js
 *       budget.routes.js
 *       analytics.routes.js
 *     controllers/
 *       auth.controller.js
 *       transactions.controller.js
 *       budget.controller.js
 *       analytics.controller.js
 *     middleware/
 *       auth.middleware.js
 *       errorHandler.js
 *       rateLimiter.js
 *       validate.js
 *     prisma/
 *       schema.prisma
 *     utils/
 *       logger.js
 *       jwt.js
 */

import express        from "express";
import cors           from "cors";
import helmet         from "helmet";
import morgan         from "morgan";
import dotenv         from "dotenv";
import { rateLimit }  from "express-rate-limit";

import authRoutes        from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transactions.routes.js";
import budgetRoutes      from "./routes/budget.routes.js";
import analyticsRoutes   from "./routes/analytics.routes.js";
import { errorHandler }  from "./middleware/errorHandler.js";
import { logger }        from "./utils/logger.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());                              // Security headers
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. mobile apps, Postman)
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    // Allow any Vercel preview URL
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));      // Body parser (limit payload size)
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

// Global rate limiter — 500 requests / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  standardHeaders: true,
  message: { success:false, message:"Too many requests. Please try again later." },
}));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status:"ok", timestamp: new Date().toISOString() }));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/v1/auth",         authRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/budget",       budgetRoutes);
app.use("/api/v1/analytics",    analyticsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success:false, message:"Route not found." }));

// ─── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => logger.info(`🚀 FinTrack API running on port ${PORT}`));

export default app;
