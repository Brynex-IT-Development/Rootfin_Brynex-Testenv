import mongoose from "mongoose";

const subscriptionLedgerSchema = new mongoose.Schema(
  {
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    date: { type: Date, default: Date.now },
    subscriptionName: { type: String, required: true, trim: true }, // e.g. Google Workspace, Zoho
    storeName: { type: String, default: "", trim: true },
    locCode: { type: String, default: "", trim: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    remarks: { type: String, default: "", trim: true },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

subscriptionLedgerSchema.index({ date: -1 });
subscriptionLedgerSchema.index({ fromDate: 1, toDate: 1 });
subscriptionLedgerSchema.index({ subscriptionName: 1, date: -1 });

const SubscriptionLedger = mongoose.model("SubscriptionLedger", subscriptionLedgerSchema);
export default SubscriptionLedger;
