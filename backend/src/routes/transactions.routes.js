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


