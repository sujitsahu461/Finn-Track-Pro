/**
 * Auth Controller — signup / login / refresh / logout
 * Uses bcrypt for password hashing, JWT for access tokens,
 * and rotating refresh tokens stored in PostgreSQL.
 */

import bcrypt        from "bcryptjs";
import { z }         from "zod";
import { prisma }    from "../utils/prisma.js";
import { signTokens, verifyRefreshToken } from "../utils/jwt.js";
import { AppError }  from "../middleware/errorHandler.js";
import { logger }    from "../utils/logger.js";

// ─── Validation Schemas ───────────────────────────────────────────────────────
const signupSchema = z.object({
  name:     z.string().min(2).max(80),
  username: z.string().min(3).max(30),
  email:    z.string().email(),
  password: z.string().min(8).max(72).regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain a number"),
});

const loginSchema = z.object({
  username: z.string().optional(),
  email:    z.string().email().optional(),
  password: z.string().min(1),
});

// ─── Signup ───────────────────────────────────────────────────────────────────
export const signup = async (req, res, next) => {
  try {
    const { name, username, email, password } = signupSchema.parse(req.body);

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) throw new AppError("Email or Username already registered.", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, username, email, passwordHash } });

    const { accessToken, refreshToken } = await signTokens(user.id, prisma);

    logger.info(`New signup: ${email}`);
    res.status(201).json({
      success: true,
      data: { user: { id:user.id, name:user.name, username:user.username, email:user.email }, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { username, email, password } = loginSchema.parse(req.body);
    
    if (!username && !email) throw new AppError("Please provide an email or username.", 400);

    const user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          ...(email ? [{ email }] : []),
          ...(username ? [{ username }] : [])
        ]
      } 
    });
    if (!user) throw new AppError("Invalid credentials.", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials.", 401);

    const { accessToken, refreshToken } = await signTokens(user.id, prisma);

    logger.info(`Login: ${email || username}`);
    res.json({
      success: true,
      data: { user: { id:user.id, name:user.name, username:user.username, email:user.email, currency:user.currency }, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Access Token ─────────────────────────────────────────────────────
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const userId = await verifyRefreshToken(refreshToken, prisma);
    if (!userId) throw new AppError("Invalid or expired refresh token.", 401);

    // Rotate: delete old, issue new pair
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    const { accessToken, refreshToken: newRefresh } = await signTokens(userId, prisma);

    res.json({ success:true, data: { accessToken, refreshToken: newRefresh } });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success:true, message:"Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.userId },
      select: { id:true, name:true, username:true, email:true, currency:true, createdAt:true },
    });
    if (!user) throw new AppError("User not found.", 404);
    res.json({ success:true, data: { user } });
  } catch (err) {
    next(err);
  }
};
