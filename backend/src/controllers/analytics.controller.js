/**
 * Analytics Controller
 * Computes monthly summaries, category breakdowns, and trends.
 * All queries use raw Prisma aggregations for performance.
 */

import { prisma } from "../utils/prisma.js";

// Helper: get first/last day of a month
const monthBounds = (year, month) => ({
  gte: new Date(year, month - 1, 1),
  lte: new Date(year, month,     0, 23, 59, 59),
});

// ─── GET /analytics/summary?year=2024&month=4 ─────────────────────────────────
export const getSummary = async (req, res, next) => {
  try {
    const year  = parseInt(req.query.year  || new Date().getFullYear());
    const month = parseInt(req.query.month || new Date().getMonth() + 1);
    const range = monthBounds(year, month);

    const [income, expense, txCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId:req.userId, type:"INCOME", date:range },
        _sum:  { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId:req.userId, type:"EXPENSE", date:range },
        _sum:  { amount: true },
      }),
      prisma.transaction.count({ where: { userId:req.userId, date:range } }),
    ]);

    const totalIncome  = Number(income._sum.amount  || 0);
    const totalExpense = Number(expense._sum.amount || 0);
    const balance      = totalIncome - totalExpense;
    const savingsRate  = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(2) : "0.00";

    res.json({
      success: true,
      data: {
        summary: { year, month, totalIncome, totalExpense, balance, savingsRate: parseFloat(savingsRate), txCount },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /analytics/monthly?year=2024 ────────────────────────────────────────
// Returns income + expense totals for each month of the year
export const getMonthly = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());

    const rows = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM date)::int  AS month,
        type,
        SUM(amount)::float             AS total
      FROM transactions
      WHERE user_id = ${req.userId}
        AND EXTRACT(YEAR FROM date) = ${year}
      GROUP BY month, type
      ORDER BY month
    `;

    // Reshape into [{month:1, income:X, expense:Y}, ...]
    const map = {};
    for (const row of rows) {
      if (!map[row.month]) map[row.month] = { month:row.month, income:0, expenses:0 };
      if (row.type === "INCOME")  map[row.month].income   = row.total;
      if (row.type === "EXPENSE") map[row.month].expenses = row.total;
    }

    const months = Array.from({ length:12 }, (_, i) => map[i+1] || { month:i+1, income:0, expenses:0 });

    res.json({ success:true, data: { year, months } });
  } catch (err) {
    next(err);
  }
};

// ─── GET /analytics/categories?year=2024&month=4 ──────────────────────────────
// Returns per-category expense totals for the month
export const getCategories = async (req, res, next) => {
  try {
    const year  = parseInt(req.query.year  || new Date().getFullYear());
    const month = parseInt(req.query.month || new Date().getMonth() + 1);
    const range = monthBounds(year, month);

    const groups = await prisma.transaction.groupBy({
      by:     ["category"],
      where:  { userId:req.userId, type:"EXPENSE", date:range },
      _sum:   { amount: true },
      orderBy:{ _sum: { amount:"desc" } },
    });

    const categories = groups.map(g => ({
      category: g.category,
      total:    Number(g._sum.amount || 0),
    }));

    res.json({ success:true, data: { year, month, categories } });
  } catch (err) {
    next(err);
  }
};

// ─── GET /analytics/trends?months=6 ──────────────────────────────────────────
// Net balance trend for the last N months
export const getTrends = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months || 6), 12);
    const from   = new Date();
    from.setMonth(from.getMonth() - months + 1);
    from.setDate(1);

    const rows = await prisma.$queryRaw`
      SELECT
        EXTRACT(YEAR  FROM date)::int AS year,
        EXTRACT(MONTH FROM date)::int AS month,
        type,
        SUM(amount)::float            AS total
      FROM transactions
      WHERE user_id = ${req.userId}
        AND date >= ${from}
      GROUP BY year, month, type
      ORDER BY year, month
    `;

    // Reshape
    const map = {};
    for (const r of rows) {
      const key = `${r.year}-${String(r.month).padStart(2,"0")}`;
      if (!map[key]) map[key] = { period:key, income:0, expenses:0 };
      if (r.type === "INCOME")  map[key].income   = r.total;
      if (r.type === "EXPENSE") map[key].expenses = r.total;
    }

    const trends = Object.values(map).map(t => ({ ...t, net:t.income - t.expenses }));

    res.json({ success:true, data: { trends } });
  } catch (err) {
    next(err);
  }
};
