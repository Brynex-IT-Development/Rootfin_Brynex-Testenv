import mongoose from "mongoose";

const vendorLedgerSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    vendorId: { type: String, default: "", trim: true },
    vendorName: { type: String, required: true, trim: true },
    storeName: { type: String, default: "", trim: true },
    locCode: { type: String, default: "", trim: true },
    reference: { type: String, default: "", trim: true }, // bill / invoice number
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    remarks: { type: String, default: "", trim: true },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

vendorLedgerSchema.index({ date: -1 });
vendorLedgerSchema.index({ vendorName: 1, date: -1 });

const VendorLedger = mongoose.model("VendorLedger", vendorLedgerSchema);
export default VendorLedger;
