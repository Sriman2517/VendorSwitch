# Sample AI Assistant Prompts

Use these in the AI Assistant page under **Generate Routing Rule**.

## Lowest latency with priority fallback

```text
Use Lowest Latency for PAN Verification.
If latency exceeds 2000ms or error rate exceeds 5%, fallback to Priority Routing.
Minimum availability should be 95%.
```

Expected generated config:

```json
{
  "capability": "PAN_VERIFICATION",
  "strategy": "LOWEST_LATENCY",
  "fallbackStrategy": "PRIORITY",
  "thresholds": {
    "maxLatencyMs": 2000,
    "maxErrorRate": 5,
    "minAvailability": 95
  }
}
```

## Weighted SMS routing

```text
Use Weighted Routing for SMS.
If the selected vendor fails or reaches a rate limit, fallback to Priority Routing.
Keep max latency at 2000ms, max error rate at 5%, and minimum availability at 95%.
```

## Lowest cost OCR routing

```text
Use Lowest Cost routing for OCR.
If no low-cost vendor is eligible, fallback to Lowest Latency.
Ignore vendors above 2000ms latency or above 5% error rate.
Minimum availability should be 95%.
```

## Health-based OCR routing

```text
Use Health Based routing for OCR.
Prefer vendors with high availability, low error rate, and low latency.
Fallback to Lowest Cost if the healthiest vendor is not available.
Use 2000ms max latency, 5% max error rate, and 95% minimum availability.
```
