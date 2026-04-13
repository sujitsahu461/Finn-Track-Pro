/**
 * Transactions Controller — CRUD + Filtering + Pagination
 * All operations are scoped to req.userId (JWT-authenticated).
 */

import { z }        from "zod";
import { prisma }   from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const txSchema = z.object({
  type:        z.enum(["INCOME","EXPENSE"]),
  amount:      z.number().positive().multipleOf(0.01),
  category:    z.string().min(1).max(50),
  description: z.string().min(1).max(255),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  recurring:   z.boolean().optional().default(false),
  recurrence:  z.enum(["DAILY","WEEKLY","MONTHLY","YEARLY"]).optional().nullable(),
  notes:       z.string().max(500).optional().nullable(),
});

const querySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  type:     z.enum(["INCOME","EXPENSE"]).optional(),
  category: z.string().optional(),
  search:   z.string().optional(),
  from:     z.string().optional(),   // YYYY-MM-DD
  to:       z.string().optional(),   // YYYY-MM-DD
  sort:     z.enum(["date","amount","category"]).default("date"),
  order:    z.enum(["asc","desc"]).default("desc"),
});

// ─── GET /transactions ────────────────────────────────────────────────────────
export const getTransactions = async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query);

    const where = {
      userId: req.userId,
      ...(q.type     && { type: q.type }),
      ...(q.category && { category: { equals: q.category, mode:"insensitive" } }),
      ...(q.search   && { description: { contains: q.search, mode:"insensitive" } }),
      ...(q.from || q.to) && {
        date: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to   && { lte: new Date(q.to)   }),
        },
      },
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [q.sort]: q.order },
        skip:    (q.page - 1) * q.limit,
        take:    q.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: { page:q.page, limit:q.limit, total, totalPages:Math.ceil(total/q.limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /transactions/:id ────────────────────────────────────────────────────
export const getTransaction = async (req, res, next) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id:req.params.id, userId:req.userId },
    });
    if (!tx) throw new AppError("Transaction not found.", 404);
    res.json({ success:true, data: { transaction: tx } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /transactions ───────────────────────────────────────────────────────
export const createTransaction = async (req, res, next) => {
  try {
    const body = txSchema.parse(req.body);

    const tx = await prisma.transaction.create({
      data: {
        ...body,
        date:   new Date(body.date),
        userId: req.userId,
      },
    });

    res.status(201).json({ success:true, data: { transaction: tx } });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /transactions/:id ──────────────────────────────────────────────────
export const updateTransaction = async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id:req.params.id, userId:req.userId },
    });
    if (!existing) throw new AppError("Transaction not found.", 404);

    const body = txSchema.partial().parse(req.body);

    const tx = await prisma.transaction.update({
      where: { id: req.params.id },
      data:  { ...body, ...(body.date && { date: new Date(body.date) }) },
    });

    res.json({ success:true, data: { transaction: tx } });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /transactions/:id ─────────────────────────────────────────────────
export const deleteTransaction = async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id:req.params.id, userId:req.userId },
    });
    if (!existing) throw new AppError("Transaction not found.", 404);

    await prisma.transaction.delete({ where: { id:req.params.id } });
    res.json({ success:true, message:"Transaction deleted." });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /transactions (bulk) ──────────────────────────────────────────────
export const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);
    const { count } = await prisma.transaction.deleteMany({
      where: { id: { in:ids }, userId: req.userId },
    });
    res.json({ success:true, message:`${count} transaction(s) deleted.` });
  } catch (err) {
    next(err);
  }
};
