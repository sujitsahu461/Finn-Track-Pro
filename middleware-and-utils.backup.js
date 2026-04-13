// ─────────────────────────────────────────────────────────────────────────────
// middleware/auth.middleware.js
// Verifies the Bearer JWT access token on protected routes.
// ─────────────────────────────────────────────────────────────────────────────

import jwt       from "jsonwebtoken";
import { AppError } from "./errorHandler.js";

export const protect = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError("Authentication required.", 401));

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = decoded.sub;
    next();
  } catch {
    next(new AppError("Invalid or expired token.", 401));
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// middleware/errorHandler.js
// Centralized error handling — converts errors to clean JSON responses.
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from "../utils/logger.js";
import { ZodError }  from "zod";

/** Custom application error with HTTP status code */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (err, _req, res, _next) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors:  err.errors.map(e => ({ field:e.path.join("."), message:e.message })),
    });
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({ success:false, message:"Resource already exists." });
  }

  // Known application errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success:false, message:err.message });
  }

  // Unknown / programming errors — log and return generic message
  logger.error("Unhandled error:", err);
  return res.status(500).json({ success:false, message:"Internal server error." });
};


// ─────────────────────────────────────────────────────────────────────────────
// utils/jwt.js
// Sign access + refresh tokens, verify refresh tokens.
// ─────────────────────────────────────────────────────────────────────────────

import jwt    from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_EXPIRY  = "15m";
const REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Sign a new access token + refresh token pair.
 * Refresh token is stored (hashed) in the database.
 */
export const signTokens = async (userId, prisma) => {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

  // Refresh token: random 64-byte hex string (not a JWT)
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt    = new Date(Date.now() + REFRESH_EXPIRY * 1000);

  await prisma.refreshToken.create({
    data: { token:refreshToken, userId, expiresAt },
  });

  return { accessToken, refreshToken };
};

/**
 * Verify a refresh token against the database.
 * Returns userId if valid, null otherwise.
 */
export const verifyRefreshToken = async (token, prisma) => {
  const record = await prisma.refreshToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return null;
  return record.userId;
};


// ─────────────────────────────────────────────────────────────────────────────
// utils/logger.js
// Simple Winston-based logger.
// ─────────────────────────────────────────────────────────────────────────────

import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename:"logs/error.log",  level:"error" }),
    new winston.transports.File({ filename:"logs/combined.log" }),
  ],
});


// ─────────────────────────────────────────────────────────────────────────────
// utils/prisma.js
// Singleton Prisma client (avoids exhausting DB connections in dev)
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
export const prisma   = globalForPrisma.prisma ?? new PrismaClient({ log:["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
