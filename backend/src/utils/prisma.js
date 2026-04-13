// utils/prisma.js
// Singleton Prisma client (avoids exhausting DB connections in dev)
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
export const prisma   = globalForPrisma.prisma ?? new PrismaClient({ log:["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
