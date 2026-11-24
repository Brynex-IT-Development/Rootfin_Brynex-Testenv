import mongoose from "mongoose";

const ExpenseSubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
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

ExpenseSubCategorySchema.index({ name: 1, category: 1, expenseType: 1 }, { unique: true });

const ExpenseSubCategory = mongoose.model("ExpenseSubCategory", ExpenseSubCategorySchema);
export default ExpenseSubCategory;
