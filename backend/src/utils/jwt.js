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


