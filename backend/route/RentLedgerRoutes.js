import express from "express";
import {
  createRentLedger,
  getRentLedgers,
  deleteRentLedger,
} from "../controllers/RentLedgerController.js";
import { createTenant, getTenants } from "../controllers/TenantController.js";

const router = express.Router();

router.post("/rent-ledgers", createRentLedger);
router.get("/rent-ledgers", getRentLedgers);
router.delete("/rent-ledgers/:id", deleteRentLedger);

router.post("/rent-tenants", createTenant);
router.get("/rent-tenants", getTenants);

export default router;

