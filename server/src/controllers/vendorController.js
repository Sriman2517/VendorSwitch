import Vendor from "../models/Vendor.js";
import { httpError } from "../utils/httpError.js";

function normalizeVendorBody(body) {
  const vendor = {
    name: body.name,
    capability: String(body.capability || "").toUpperCase(),
    enabled: body.enabled ?? true,
    priority: body.priority ?? 1,
    weight: body.weight ?? 1,
    costPerRequest: body.costPerRequest,
    timeoutMs: body.timeoutMs ?? 2000,
    rateLimitPerMinute: body.rateLimitPerMinute ?? 60,
    supportedFeatures: body.supportedFeatures ?? [],
    endpointUrl: body.endpointUrl ?? "",
    health: body.health
  };

  if (body.rateLimit) {
    vendor.rateLimit = body.rateLimit;
  }

  return vendor;
}

export async function createVendor(req, res, next) {
  try {
    if (!req.body.name || !req.body.capability || req.body.costPerRequest === undefined) {
      throw httpError(400, "name, capability, and costPerRequest are required");
    }

    const vendor = await Vendor.findOneAndUpdate(
      {
        name: req.body.name,
        capability: String(req.body.capability).toUpperCase()
      },
      normalizeVendorBody(req.body),
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(201).json({
      status: "SUCCESS",
      data: vendor
    });
  } catch (error) {
    next(error);
  }
}

export async function getVendors(req, res, next) {
  try {
    const filter = {};

    if (req.query.capability) {
      filter.capability = String(req.query.capability).toUpperCase();
    }

    const vendors = await Vendor.find(filter).sort({ capability: 1, priority: 1, costPerRequest: 1 });

    res.json({
      status: "SUCCESS",
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
}
