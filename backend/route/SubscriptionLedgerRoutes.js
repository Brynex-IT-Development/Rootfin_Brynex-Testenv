import express from "express";
import {
  createSubscriptionLedger,
  getSubscriptionLedgers,
  deleteSubscriptionLedger,
} from "../controllers/SubscriptionLedgerController.js";

const router = express.Router();

router.post("/subscription-ledgers", createSubscriptionLedger);
router.get("/subscription-ledgers", getSubscriptionLedgers);
router.delete("/subscription-ledgers/:id", deleteSubscriptionLedger);

export default router;
