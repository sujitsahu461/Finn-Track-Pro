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


