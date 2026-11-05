import express from "express";
import {
  createRentLedger,
  getRentLedgers,
  deleteRentLedger,
} from "../controllers/RentLedgerController.js";

const router = express.Router();

router.post("/rent-ledgers", createRentLedger);
router.get("/rent-ledgers", getRentLedgers);
router.delete("/rent-ledgers/:id", deleteRentLedger);

export default router;

