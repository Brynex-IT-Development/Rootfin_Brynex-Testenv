import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

tenantSchema.index({ name: 1, locCode: 1 });

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
