const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

function fallbackRuleFromText(text) {
  const input = String(text || "").toLowerCase();
  const capability = input.includes("ocr") ? "OCR" : input.includes("sms") ? "SMS" : "PAN_VERIFICATION";
  const strategy = input.includes("weighted")
    ? "WEIGHTED"
    : input.includes("cost")
      ? "LOWEST_COST"
      : input.includes("priority") && !input.includes("latency")
        ? "PRIORITY"
        : "LOWEST_LATENCY";
  const fallbackStrategy = input.includes("fallback") && input.includes("priority") ? "PRIORITY" : "LOWEST_LATENCY";
  const latencyMatch = String(text || "").match(/(\d+)\s*ms/i);
  const errorMatch = String(text || "").match(/error rate exceeds\s*(\d+)/i) || String(text || "").match(/(\d+)\s*%/i);

  return {
    capability,
    strategy,
    fallbackStrategy,
    thresholds: {
      maxLatencyMs: latencyMatch ? Number(latencyMatch[1]) : 2000,
      maxErrorRate: errorMatch ? Number(errorMatch[1]) : 5,
      minAvailability: 95
    }
  };
}

function ruleExplanation(rule) {
  return `The generated configuration routes ${rule.capability.replaceAll("_", " ").toLowerCase()} requests using ${rule.strategy.replaceAll("_", " ")}. Vendors whose latency exceeds ${rule.thresholds.maxLatencyMs} ms or whose error rate exceeds ${rule.thresholds.maxErrorRate}% are ignored. If no suitable vendor exists, ${rule.fallbackStrategy.replaceAll("_", " ")} is applied.`;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

function geminiText(response) {
  return response?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${body}`);
  }

  return geminiText(await response.json());
}

export async function generateRoutingRule(prompt) {
  const fallbackRule = fallbackRuleFromText(prompt);
  const fallback = {
    rule: fallbackRule,
    explanation: ruleExplanation(fallbackRule),
    source: "fallback"
  };

  try {
    const text = await callGemini(`You are an internal fintech routing configuration assistant.
Generate one routing rule JSON object from this administrator instruction:

${prompt}

Return only JSON with this exact shape:
{
  "capability": "PAN_VERIFICATION",
  "strategy": "LOWEST_LATENCY",
  "fallbackStrategy": "PRIORITY",
  "thresholds": {
    "maxLatencyMs": 2000,
    "maxErrorRate": 5,
    "minAvailability": 95
  },
  "explanation": "short admin explanation"
}

Allowed capabilities: PAN_VERIFICATION, OCR, SMS.
Allowed strategies: PRIORITY, WEIGHTED, LOWEST_LATENCY, LOWEST_COST, FAILOVER, FEATURE_BASED, HEALTH_BASED.
Allowed fallback strategies: PRIORITY, LOWEST_LATENCY, LOWEST_COST, FAILOVER.`);

    const parsed = safeJsonParse(text);

    if (!parsed) {
      return fallback;
    }

    const rule = {
      capability: parsed.capability || fallbackRule.capability,
      strategy: parsed.strategy || fallbackRule.strategy,
      fallbackStrategy: parsed.fallbackStrategy || fallbackRule.fallbackStrategy,
      thresholds: {
        maxLatencyMs: Number(parsed.thresholds?.maxLatencyMs ?? fallbackRule.thresholds.maxLatencyMs),
        maxErrorRate: Number(parsed.thresholds?.maxErrorRate ?? fallbackRule.thresholds.maxErrorRate),
        minAvailability: Number(parsed.thresholds?.minAvailability ?? fallbackRule.thresholds.minAvailability)
      }
    };

    return {
      rule,
      explanation: parsed.explanation || ruleExplanation(rule),
      source: "gemini"
    };
  } catch {
    return fallback;
  }
}

export async function explainRoutingDecision(log) {
  const fallback = [
    `${log.vendorUsed || "No vendor"} was selected because:`,
    ...(log.decisions || []).map((decision) => `- ${decision}`),
    `- The rule-based routing engine enforced the configured ${log.strategy} strategy for ${log.capability}.`
  ].join("\n");

  try {
    const text = await callGemini(`You are explaining a fintech vendor-routing decision to an operations engineer.
Do not claim that AI made the routing decision. The routing decision was rule-based.
Use concise bullets.

Routing log:
${JSON.stringify(log, null, 2)}`);

    return {
      explanation: text || fallback,
      source: "gemini"
    };
  } catch {
    return {
      explanation: fallback,
      source: "fallback"
    };
  }
}

export async function analyzeVendorHealth(vendor) {
  const health = vendor.health || {};
  const fallback =
    health.status === "DOWN"
      ? `${vendor.name} is currently down or unavailable. Keep it out of active routing until availability and error rate recover.`
      : health.status === "DEGRADED"
        ? `${vendor.name} is experiencing elevated latency or errors over recent requests. Consider temporarily routing more traffic to healthier vendors until performance improves.`
        : `${vendor.name} is performing normally and is suitable for handling additional traffic.`;

  try {
    const text = await callGemini(`You are an internal fintech operations assistant.
Analyze this vendor health snapshot and recommend operational action in two short sentences.
Do not make the routing decision; only recommend.

Vendor:
${JSON.stringify(vendor, null, 2)}`);

    return {
      insight: text || fallback,
      source: "gemini"
    };
  } catch {
    return {
      insight: fallback,
      source: "fallback"
    };
  }
}
