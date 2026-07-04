import RequestLog from "../models/RequestLog.js";
import Vendor from "../models/Vendor.js";

async function getVendorAttemptRecords(vendorName, options = {}) {
  const query = {
    $or: [{ "attemptedVendors.vendorName": vendorName }, { vendorUsed: vendorName }]
  };

  if (options.since) {
    query.createdAt = { $gte: options.since };
  }

  const logs = await RequestLog.find(query)
    .sort({ createdAt: -1 })
    .limit(options.logLimit || 200)
    .select("vendorUsed status latencyMs routingReason attemptedVendors createdAt")
    .lean();

  const attempts = [];

  for (const log of logs) {
    const matchingAttempts = (log.attemptedVendors || []).filter((attempt) => attempt.vendorName === vendorName);

    if (matchingAttempts.length > 0) {
      attempts.push(...matchingAttempts);
    } else if (log.vendorUsed === vendorName) {
      attempts.push({
        vendorName,
        status: log.status,
        latencyMs: log.latencyMs,
        reason: log.routingReason
      });
    }
  }

  return options.attemptLimit ? attempts.slice(0, options.attemptLimit) : attempts;
}

function calculateHealthStatus({ avgLatencyMs, errorRate, availability, timeoutMs }) {
  const degradedLatencyMs = Math.min(timeoutMs, 2000);

  if (availability < 80 || errorRate > 20 || avgLatencyMs >= timeoutMs) {
    return "DOWN";
  }

  if (errorRate > 5 || avgLatencyMs > degradedLatencyMs) {
    return "DEGRADED";
  }

  return "UP";
}

export async function updateRateLimitUsage(vendor) {
  const windowSizeSeconds = vendor.rateLimit?.windowSizeSeconds || 60;
  const windowStart = new Date(Date.now() - windowSizeSeconds * 1000);
  const recentCalls = await getVendorAttemptRecords(vendor.name, {
    since: windowStart,
    logLimit: Math.max(vendor.rateLimitPerMinute * 3, 200)
  });

  await Vendor.updateOne(
    { _id: vendor._id },
    {
      "rateLimit.currentUsage": recentCalls.length,
      "rateLimit.windowStartedAt": windowStart,
      "rateLimit.windowSizeSeconds": windowSizeSeconds,
      "rateLimit.lastUpdatedAt": new Date()
    }
  );

  return {
    currentUsage: recentCalls.length,
    limit: vendor.rateLimitPerMinute,
    isLimited: recentCalls.length >= vendor.rateLimitPerMinute
  };
}

export async function isRateLimited(vendor) {
  const usage = await updateRateLimitUsage(vendor);
  return usage.isLimited;
}

export async function refreshVendorMetrics(vendorName) {
  const vendor = await Vendor.findOne({ name: vendorName }).lean();

  if (!vendor) {
    return null;
  }

  const attempts = await getVendorAttemptRecords(vendorName, { attemptLimit: 100 });
  const windowSizeSeconds = vendor.rateLimit?.windowSizeSeconds || 60;
  const windowStart = new Date(Date.now() - windowSizeSeconds * 1000);
  const currentUsage = await getVendorAttemptRecords(vendorName, {
    since: windowStart,
    logLimit: Math.max(vendor.rateLimitPerMinute * 3, 200)
  });

  if (attempts.length === 0) {
    return Vendor.findOneAndUpdate(
      { name: vendorName },
      {
        "rateLimit.currentUsage": currentUsage.length,
        "rateLimit.windowStartedAt": windowStart,
        "rateLimit.windowSizeSeconds": windowSizeSeconds,
        "rateLimit.lastUpdatedAt": new Date()
      },
      { new: true }
    );
  }

  const successCount = attempts.filter((attempt) => attempt.status === "SUCCESS").length;
  const totalLatency = attempts.reduce((sum, attempt) => sum + (attempt.latencyMs || 0), 0);
  const avgLatencyMs = Math.round(totalLatency / attempts.length);
  const successRate = Number(((successCount / attempts.length) * 100).toFixed(2));
  const errorRate = Number((100 - successRate).toFixed(2));
  const availability = successRate;
  const status = calculateHealthStatus({
    avgLatencyMs,
    errorRate,
    availability,
    timeoutMs: vendor.timeoutMs
  });

  return Vendor.findOneAndUpdate(
    { name: vendorName },
    {
      "health.status": status,
      "health.avgLatencyMs": avgLatencyMs,
      "health.successRate": successRate,
      "health.errorRate": errorRate,
      "health.availability": availability,
      "health.lastCheckedAt": new Date(),
      "rateLimit.currentUsage": currentUsage.length,
      "rateLimit.windowStartedAt": windowStart,
      "rateLimit.windowSizeSeconds": windowSizeSeconds,
      "rateLimit.lastUpdatedAt": new Date()
    },
    { new: true }
  );
}

export async function getCapabilityMetrics(capability) {
  const query = capability ? { capability: capability.toUpperCase() } : {};
  const vendors = await Vendor.find(query).sort({ capability: 1, priority: 1 }).lean();

  return Promise.all(
    vendors.map(async (vendor) => {
      const windowSizeSeconds = vendor.rateLimit?.windowSizeSeconds || 60;
      const windowStart = new Date(Date.now() - windowSizeSeconds * 1000);
      const recentCalls = await getVendorAttemptRecords(vendor.name, {
        since: windowStart,
        logLimit: Math.max(vendor.rateLimitPerMinute * 3, 200)
      });

      return {
        id: vendor._id,
        name: vendor.name,
        capability: vendor.capability,
        enabled: vendor.enabled,
        priority: vendor.priority,
        weight: vendor.weight,
        costPerRequest: vendor.costPerRequest,
        rateLimitPerMinute: vendor.rateLimitPerMinute,
        currentMinuteUsage: recentCalls.length,
        rateLimit: {
          ...(vendor.rateLimit || {}),
          currentUsage: recentCalls.length,
          limit: vendor.rateLimitPerMinute,
          remaining: Math.max(vendor.rateLimitPerMinute - recentCalls.length, 0),
          isLimited: recentCalls.length >= vendor.rateLimitPerMinute
        },
        health: vendor.health
      };
    })
  );
}
