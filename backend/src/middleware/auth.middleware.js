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


