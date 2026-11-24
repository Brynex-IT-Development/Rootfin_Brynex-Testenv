import mongoose from "mongoose";

const BankAccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: String,
      trim: true,
      default: "Admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

BankAccountSchema.index({ name: 1 }, { unique: true });

const BankAccount = mongoose.model("BankAccount", BankAccountSchema);
export default BankAccount;
