import express from "express";
import { getRoutingRules, upsertRoutingRule } from "../controllers/ruleController.js";

const router = express.Router();

router.get("/", getRoutingRules);
router.post("/", upsertRoutingRule);

export default router;
