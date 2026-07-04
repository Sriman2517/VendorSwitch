function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMockResponse(capability, payload) {
  if (capability === "PAN_VERIFICATION") {
    return {
      panStatus: "VALID",
      nameMatch: Boolean(payload?.name),
      normalizedName: payload?.name || null
    };
  }

  return {
    accepted: true,
    referenceId: `SIM-${Date.now()}`
  };
}

export async function callVendor(vendor, requestPayload) {
  const simulatedLatency = Math.max(
    50,
    Math.round(vendor.health.avgLatencyMs * (0.75 + Math.random() * 0.5))
  );

  await wait(Math.min(simulatedLatency, vendor.timeoutMs));

  if (vendor.health.status === "DOWN") {
    const error = new Error(`${vendor.name} is marked DOWN`);
    error.code = "VENDOR_DOWN";
    throw error;
  }

  if (simulatedLatency > vendor.timeoutMs) {
    const error = new Error(`${vendor.name} timed out after ${vendor.timeoutMs}ms`);
    error.code = "TIMEOUT";
    throw error;
  }

  const successProbability = vendor.health.successRate / 100;
  if (Math.random() > successProbability) {
    const error = new Error(`${vendor.name} returned an upstream error`);
    error.code = "UPSTREAM_ERROR";
    throw error;
  }

  return {
    latencyMs: simulatedLatency,
    response: buildMockResponse(vendor.capability, requestPayload)
  };
}
