import mongoose from "mongoose";

const rentLedgerSchema = new mongoose.Schema(
  {
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
    tenantName: {
      type: String,
      default: "",
      trim: true,
    },
    // Date the rent for this period has to be paid by
    dueDate: {
      type: Date,
      default: null,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    locCode: {
      type: String,
      default: "",
      trim: true,
    },
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

rentLedgerSchema.index({ date: -1 });
rentLedgerSchema.index({ fromDate: 1, toDate: 1 });
rentLedgerSchema.index({ locCode: 1, date: -1 });

const RentLedger = mongoose.model("RentLedger", rentLedgerSchema);
export default RentLedger;

