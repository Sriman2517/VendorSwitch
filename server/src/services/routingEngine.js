import { randomUUID } from "crypto";
import RequestLog from "../models/RequestLog.js";
import RoutingRule from "../models/RoutingRule.js";
import Vendor from "../models/Vendor.js";
import { httpError } from "../utils/httpError.js";
import { isRateLimited, refreshVendorMetrics } from "./metricsService.js";
import { callVendor } from "./vendorExecutor.js";

function normalizeCapability(capability) {
  return String(capability || "").trim().toUpperCase();
}

function hasRequiredFeatures(vendor, requiredFeatures = []) {
  return requiredFeatures.every((feature) => vendor.supportedFeatures.includes(feature));
}

function explainSkip(vendor, requirements, rule, rateLimited) {
  if (!vendor.enabled) return `${vendor.name} skipped because it is disabled`;
  if (vendor.health.status === "DOWN") return `${vendor.name} skipped because it is down`;
  if (rateLimited) return `${vendor.name} skipped because rate limit is reached`;
  if (!hasRequiredFeatures(vendor, requirements.requiredFeatures)) {
    return `${vendor.name} skipped because required features are missing`;
  }
  if (vendor.health.avgLatencyMs > (requirements.maxLatencyMs || rule.thresholds.maxLatencyMs)) {
    return `${vendor.name} skipped because latency crosses threshold`;
  }
  if (vendor.health.errorRate > rule.thresholds.maxErrorRate) {
    return `${vendor.name} skipped because error rate is high`;
  }
  if (vendor.health.availability < rule.thresholds.minAvailability) {
    return `${vendor.name} skipped because availability is low`;
  }
  return null;
}

async function loadRule(capability, requirements) {
  const existingRule = await RoutingRule.findOne({ capability, enabled: true });

  if (existingRule) {
    return existingRule;
  }

  return RoutingRule.create({
    capability,
    strategy: requirements.preferLowCost ? "lowest_cost" : "priority"
  });
}

async function prepareCandidates(vendors, rule, requirements) {
  const decisions = [];
  const candidates = [];

  for (const vendor of vendors) {
    const rateLimited = await isRateLimited(vendor);
    const skipReason = explainSkip(vendor, requirements, rule, rateLimited);

    if (skipReason) {
      decisions.push(skipReason);
    } else {
      decisions.push(`${vendor.name} is eligible`);
      candidates.push(vendor);
    }
  }

  return { candidates, decisions };
}

function sortByPriority(vendors) {
  return [...vendors].sort((a, b) => a.priority - b.priority || a.costPerRequest - b.costPerRequest);
}

function sortByCost(vendors) {
  return [...vendors].sort((a, b) => a.costPerRequest - b.costPerRequest || a.priority - b.priority);
}

function sortByLatency(vendors) {
  return [...vendors].sort((a, b) => a.health.avgLatencyMs - b.health.avgLatencyMs || a.priority - b.priority);
}

function sortByHealth(vendors) {
  return [...vendors].sort((a, b) => {
    const aScore = a.health.availability - a.health.errorRate - a.health.avgLatencyMs / 1000;
    const bScore = b.health.availability - b.health.errorRate - b.health.avgLatencyMs / 1000;
    return bScore - aScore;
  });
}

function sortByFeatureCoverage(vendors, requiredFeatures = []) {
  return [...vendors].sort((a, b) => {
    const aScore = requiredFeatures.filter((feature) => a.supportedFeatures.includes(feature)).length;
    const bScore = requiredFeatures.filter((feature) => b.supportedFeatures.includes(feature)).length;
    return bScore - aScore || a.priority - b.priority;
  });
}

function weightedOrder(vendors) {
  const remaining = [...vendors];
  const ordered = [];

  while (remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, vendor) => sum + vendor.weight, 0);
    let cursor = Math.random() * Math.max(totalWeight, 1);
    let selectedIndex = 0;

    for (let index = 0; index < remaining.length; index += 1) {
      cursor -= remaining[index].weight;
      if (cursor <= 0) {
        selectedIndex = index;
        break;
      }
    }

    ordered.push(remaining.splice(selectedIndex, 1)[0]);
  }

  return ordered;
}

function orderedCandidates(strategy, candidates, requirements) {
  switch (strategy) {
    case "weighted":
      return weightedOrder(candidates);
    case "lowest_latency":
      return sortByLatency(candidates);
    case "lowest_cost":
      return sortByCost(candidates);
    case "health_based":
      return sortByHealth(candidates);
    case "feature_based":
      return sortByFeatureCoverage(candidates, requirements.requiredFeatures || []);
    case "failover":
    case "priority":
    default:
      return sortByPriority(candidates);
  }
}

function statusFromVendorError(error) {
  return error.code === "TIMEOUT" ? "TIMEOUT" : "FAILED";
}

async function writeLog(data) {
  const log = await RequestLog.create(data);
  const attemptedVendorNames = (data.attemptedVendors || []).map((vendor) => vendor.vendorName);
  const vendorNames = new Set([...attemptedVendorNames, data.vendorUsed].filter(Boolean));

  if (vendorNames.size > 0) {
    await Promise.all([...vendorNames].map((vendorName) => refreshVendorMetrics(vendorName)));
  }

  return log;
}

export async function routeRequest({ capability, payload = {}, requirements = {} }) {
  const requestId = randomUUID();
  const normalizedCapability = normalizeCapability(capability);

  if (!normalizedCapability) {
    throw httpError(400, "capability is required");
  }

  const rule = await loadRule(normalizedCapability, requirements);
  const vendors = await Vendor.find({ capability: normalizedCapability }).lean();

  if (vendors.length === 0) {
    await writeLog({
      requestId,
      capability: normalizedCapability,
      strategy: rule.strategy,
      status: "NO_VENDOR_AVAILABLE",
      routingReason: `No vendors registered for ${normalizedCapability}`,
      requestPayload: payload,
      decisions: [`No vendors registered for ${normalizedCapability}`]
    });

      return {
        requestId,
        status: "NO_VENDOR_AVAILABLE",
        strategy: rule.strategy,
        routingReason: `No vendors registered for ${normalizedCapability}`,
        decisions: [`No vendors registered for ${normalizedCapability}`],
        attemptedVendors: [],
        response: null
      };
  }

  const { candidates, decisions } = await prepareCandidates(vendors, rule, requirements);

  if (candidates.length === 0) {
    const log = await writeLog({
      requestId,
      capability: normalizedCapability,
      strategy: rule.strategy,
      status: "NO_VENDOR_AVAILABLE",
      routingReason: "No eligible vendor after applying health, feature, rate-limit, and threshold checks",
      requestPayload: payload,
      decisions
    });

    return {
      requestId,
      status: "NO_VENDOR_AVAILABLE",
      strategy: rule.strategy,
      routingReason: log.routingReason,
      decisions,
      attemptedVendors: [],
      response: null
    };
  }

  let ordered = orderedCandidates(rule.strategy, candidates, requirements);
  const attemptedVendors = [];
  let fallbackApplied = false;
  let nextVendorIndex = 0;

  while (nextVendorIndex < ordered.length) {
    const vendor = ordered[nextVendorIndex];
    nextVendorIndex += 1;
    const startedAt = Date.now();

    try {
      const result = await callVendor(vendor, payload);
      const latencyMs = result.latencyMs || Date.now() - startedAt;
      const routingReason = `${vendor.name} selected using ${rule.strategy} strategy after eligibility checks`;

      attemptedVendors.push({
        vendorId: String(vendor._id),
        vendorName: vendor.name,
        status: "SUCCESS",
        latencyMs,
        reason: routingReason
      });

      await writeLog({
        requestId,
        capability: normalizedCapability,
        strategy: rule.strategy,
        vendorUsed: vendor.name,
        status: "SUCCESS",
        routingReason,
        latencyMs,
        cost: vendor.costPerRequest,
        requestPayload: payload,
        responsePayload: result.response,
        decisions,
        attemptedVendors
      });

      return {
        requestId,
        status: "SUCCESS",
        vendorUsed: vendor.name,
        strategy: rule.strategy,
        routingReason,
        latencyMs,
        cost: vendor.costPerRequest,
        response: result.response,
        decisions,
        attemptedVendors
      };
    } catch (error) {
      const failedStatus = statusFromVendorError(error);
      attemptedVendors.push({
        vendorId: String(vendor._id),
        vendorName: vendor.name,
        status: failedStatus,
        latencyMs: Date.now() - startedAt,
        reason: error.message
      });
      decisions.push(`${vendor.name} failed during execution: ${error.message}`);

      if (!fallbackApplied && rule.fallbackStrategy) {
        const attemptedIds = new Set(attemptedVendors.map((attempt) => attempt.vendorId));
        const remaining = candidates.filter((candidate) => !attemptedIds.has(String(candidate._id)));
        ordered = [...ordered.slice(0, nextVendorIndex), ...orderedCandidates(rule.fallbackStrategy, remaining, requirements)];
        fallbackApplied = true;
        decisions.push(`${rule.fallbackStrategy} fallback strategy applied after ${vendor.name} failed`);
      }
    }
  }

  const finalStatus = attemptedVendors.every((vendor) => vendor.status === "TIMEOUT") ? "TIMEOUT" : "FAILED";
  const log = await writeLog({
    requestId,
    capability: normalizedCapability,
    strategy: rule.strategy,
    status: finalStatus,
    routingReason:
      finalStatus === "TIMEOUT"
        ? "All eligible vendors timed out during failover execution"
        : "All eligible vendors failed during failover execution",
    requestPayload: payload,
    decisions,
    attemptedVendors
  });

  return {
    requestId,
    status: finalStatus,
    strategy: rule.strategy,
    routingReason: log.routingReason,
    decisions,
    attemptedVendors,
    response: null
  };
}

export function summarizeStrategyCoverage() {
  return [
    "priority",
    "weighted",
    "lowest_latency",
    "lowest_cost",
    "failover",
    "feature_based",
    "health_based"
  ];
}
