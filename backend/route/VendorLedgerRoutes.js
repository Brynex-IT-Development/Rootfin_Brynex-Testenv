import express from "express";
import {
  createVendorLedger,
  getVendorLedgers,
  deleteVendorLedger,
} from "../controllers/VendorLedgerController.js";

const router = express.Router();

router.post("/vendor-ledgers", createVendorLedger);
router.get("/vendor-ledgers", getVendorLedgers);
router.delete("/vendor-ledgers/:id", deleteVendorLedger);

export default router;
