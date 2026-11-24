import mongoose from "mongoose";

const ExpenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    expenseType: {
      type: String,
      enum: ["direct", "indirect"],
      required: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ExpenseCategorySchema.index({ name: 1, expenseType: 1 }, { unique: true });

const ExpenseCategory = mongoose.model("ExpenseCategory", ExpenseCategorySchema);
export default ExpenseCategory;
