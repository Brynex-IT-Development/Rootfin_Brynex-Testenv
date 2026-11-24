import express from "express";
import {
  getExpenseCategories,
  createExpenseCategory,
  getExpenseSubCategories,
  createExpenseSubCategory,
} from "../controllers/ExpenseCategoryController.js";
import {
  getBankAccounts,
  createBankAccount,
} from "../controllers/BankAccountController.js";

const router = express.Router();

router
  .route("/expense-categories")
  .get(getExpenseCategories)
  .post(createExpenseCategory);

router
  .route("/expense-subcategories")
  .get(getExpenseSubCategories)
  .post(createExpenseSubCategory);

router
  .route("/bank-accounts")
  .get(getBankAccounts)
  .post(createBankAccount);

export default router;
