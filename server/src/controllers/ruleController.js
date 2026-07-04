import RoutingRule from "../models/RoutingRule.js";
import { httpError } from "../utils/httpError.js";

export async function upsertRoutingRule(req, res, next) {
  try {
    if (!req.body.capability) {
      throw httpError(400, "capability is required");
    }

    const rule = await RoutingRule.findOneAndUpdate(
      { capability: String(req.body.capability).toUpperCase() },
      {
        capability: String(req.body.capability).toUpperCase(),
        strategy: req.body.strategy,
        fallbackStrategy: req.body.fallbackStrategy,
        thresholds: req.body.thresholds,
        enabled: req.body.enabled ?? true
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(201).json({
      status: "SUCCESS",
      data: rule
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoutingRules(req, res, next) {
  try {
    const filter = {};

    if (req.query.capability) {
      filter.capability = String(req.query.capability).toUpperCase();
    }

    const rules = await RoutingRule.find(filter).sort({ capability: 1 });

    res.json({
      status: "SUCCESS",
      count: rules.length,
      data: rules
    });
  } catch (error) {
    next(error);
  }
}
