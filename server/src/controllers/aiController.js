import RequestLog from "../models/RequestLog.js";
import Vendor from "../models/Vendor.js";
import { analyzeVendorHealth, explainRoutingDecision, generateRoutingRule } from "../services/aiService.js";
import { httpError } from "../utils/httpError.js";

export async function generateRule(req, res, next) {
  try {
    if (!req.body.prompt) {
      throw httpError(400, "prompt is required");
    }

    const result = await generateRoutingRule(req.body.prompt);

    res.json({
      status: "SUCCESS",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function explainDecision(req, res, next) {
  try {
    const log = await RequestLog.findById(req.body.logId);

    if (!log) {
      throw httpError(404, "request log not found");
    }

    const result = await explainRoutingDecision(log.toObject());

    res.json({
      status: "SUCCESS",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function vendorInsight(req, res, next) {
  try {
    const vendor = await Vendor.findById(req.body.vendorId);

    if (!vendor) {
      throw httpError(404, "vendor not found");
    }

    const result = await analyzeVendorHealth(vendor.toObject());

    res.json({
      status: "SUCCESS",
      data: result
    });
  } catch (error) {
    next(error);
  }
}
