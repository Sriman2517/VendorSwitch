import express from "express";
import { explainDecision, generateRule, vendorInsight } from "../controllers/aiController.js";

const router = express.Router();

router.post("/generate-rule", generateRule);
router.post("/explain-decision", explainDecision);
router.post("/vendor-insight", vendorInsight);

export default router;
