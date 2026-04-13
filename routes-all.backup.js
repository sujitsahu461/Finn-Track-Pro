// ─────────────────────────────────────────────────────────────────────────────
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


// ─────────────────────────────────────────────────────────────────────────────
// routes/transactions.routes.js
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import {
  getTransactions, getTransaction, createTransaction,
  updateTransaction, deleteTransaction, bulkDelete,
} from "../controllers/transactions.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect); // all routes require auth

router.get   ("/",           getTransactions);
router.post  ("/",           createTransaction);
router.delete("/bulk",       bulkDelete);
router.get   ("/:id",        getTransaction);
router.patch ("/:id",        updateTransaction);
router.delete("/:id",        deleteTransaction);

export default router;


// ─────────────────────────────────────────────────────────────────────────────
// routes/analytics.routes.js
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { getSummary, getMonthly, getCategories, getTrends } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect);

router.get("/summary",    getSummary);    // ?year=2024&month=4
router.get("/monthly",    getMonthly);    // ?year=2024
router.get("/categories", getCategories); // ?year=2024&month=4
router.get("/trends",     getTrends);     // ?months=6

export default router;


// ─────────────────────────────────────────────────────────────────────────────
// routes/budget.routes.js
// ─────────────────────────────────────────────────────────────────────────────

import { Router }   from "express";
import { protect }  from "../middleware/auth.middleware.js";
import { z }        from "zod";
import { prisma }   from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(protect);

const budgetSchema = z.object({
  total:            z.number().positive(),
  month:            z.number().int().min(1).max(12),
  year:             z.number().int().min(2020).max(2100),
  categoryBudgets:  z.array(z.object({ category:z.string(), limit:z.number().nonnegative() })).optional(),
});

// GET  /budget?year=2024&month=4
router.get("/", async (req, res, next) => {
  try {
    const year  = parseInt(req.query.year  || new Date().getFullYear());
    const month = parseInt(req.query.month || new Date().getMonth() + 1);

    const budget = await prisma.budget.findUnique({
      where:   { userId_month_year: { userId:req.userId, month, year } },
      include: { categoryBudgets: true },
    });

    res.json({ success:true, data: { budget: budget || null } });
  } catch (err) { next(err); }
});

// POST /budget  (upsert)
router.post("/", async (req, res, next) => {
  try {
    const { total, month, year, categoryBudgets = [] } = budgetSchema.parse(req.body);

    // Upsert budget row
    const budget = await prisma.budget.upsert({
      where:  { userId_month_year: { userId:req.userId, month, year } },
      create: { userId:req.userId, total, month, year },
      update: { total },
    });

    // Replace category budgets
    if (categoryBudgets.length > 0) {
      await prisma.categoryBudget.deleteMany({ where: { budgetId:budget.id } });
      await prisma.categoryBudget.createMany({
        data: categoryBudgets.map(cb => ({ budgetId:budget.id, category:cb.category, limit:cb.limit })),
      });
    }

    const result = await prisma.budget.findUnique({
      where:   { id:budget.id },
      include: { categoryBudgets:true },
    });

    res.json({ success:true, data: { budget:result } });
  } catch (err) { next(err); }
});

export default router;
