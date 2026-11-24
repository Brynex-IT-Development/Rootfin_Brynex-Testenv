import express from "express";
import {
  getExpenseCategories,
  createExpenseCategory,
  getExpenseSubCategories,
  createExpenseSubCategory,
} from "../controllers/ExpenseCategoryController.js";

const router = express.Router();

router
  .route("/expense-categories")
  .get(getExpenseCategories)
  .post(createExpenseCategory);

router
  .route("/expense-subcategories")
  .get(getExpenseSubCategories)
  .post(createExpenseSubCategory);

export default router;
