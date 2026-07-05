# VendorSwitch

VendorSwitch is an Intelligent Vendor Routing Platform for Assignment 2. It exposes one unified API to the client and selects the best available vendor using configurable routing rules and live performance signals.

## Evaluation Coverage

| Criteria | Implementation |
| --- | --- |
| Vendor routing design | Dedicated routing engine with priority, weighted, lowest latency, lowest cost, failover, feature-based, and health-based routing. |
| Failover handling | Vendors are skipped or retried when down, rate-limited, too slow, unhealthy, or missing required features. |
| Metrics tracking | Latency, success rate, error rate, availability, current rate-limit usage, and cost are tracked through request logs and vendor health. |
| Rule/config design | Vendors and routing rules are configurable through APIs and seed/sample JSON files. |
| API design | REST APIs return standardized JSON responses and hide vendor choice from the client request contract. |
| Code quality | Controllers, models, services, routes, and sample configs are separated by responsibility. |
| Documentation | README, architecture diagram, sample requests, sample configs, routing explanation, and AI usage note are included. |

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express.js
- Database: MongoDB Atlas with Mongoose

## Folder Structure

```text
VendorSwitch
├── client
│   └── src
│       ├── api.js
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── server
│   └── src
│       ├── config
│       ├── controllers
│       ├── middleware
│       ├── models
│       ├── routes
│       ├── seed
│       ├── services
│       ├── app.js
│       └── server.js
├── sample-configs
├── sample-requests
├── ARCHITECTURE.md
├── AI_USAGE.md
└── README.md
```

## Setup

1. Install dependencies.

```bash
npm run install:all
```

2. Create `server/.env` from `server/.env.example`.

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
CLIENT_ORIGIN=http://localhost:5173
SIMULATION_MODE=true
GEMINI_API_KEY=your_gemini_api_key
```

3. Seed sample vendors and routing rule.

```bash
npm --prefix server run seed
```

4. Start the app.

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Mandatory APIs

### POST `/vendors`

Registers or updates a vendor for a capability.

```json
{
  "name": "VendorPANFast",
  "capability": "PAN_VERIFICATION",
  "enabled": true,
  "priority": 1,
  "weight": 70,
  "costPerRequest": 1.5,
  "timeoutMs": 2000,
  "rateLimitPerMinute": 100,
  "supportedFeatures": ["PAN_STATUS", "NAME_MATCH"],
  "endpointUrl": "",
  "health": {
    "status": "UP",
    "avgLatencyMs": 700,
    "successRate": 99,
    "errorRate": 1,
    "availability": 99
  }
}
```

### GET `/vendors`

Lists vendors. Supports `?capability=PAN_VERIFICATION`.

### POST `/route`

Routes a unified client request to the best eligible vendor.

```json
{
  "capability": "PAN_VERIFICATION",
  "payload": {
    "pan": "ABCDE1234F",
    "name": "Rahul Sharma"
  },
  "requirements": {
    "maxLatencyMs": 2000,
    "requiredFeatures": ["PAN_STATUS", "NAME_MATCH"]
  }
}
```

Sample response:

```json
{
  "requestId": "7f8a55f9-5a35-4ef5-a6f1-5cbbfe42f4b2",
  "status": "SUCCESS",
  "vendorUsed": "VendorPANFast",
  "routingReason": "VendorPANFast selected using lowest_latency strategy after eligibility checks",
  "latencyMs": 700,
  "cost": 1.5,
  "response": {
    "panStatus": "VALID",
    "nameMatch": true,
    "normalizedName": "Rahul Sharma"
  }
}
```

Possible route statuses:

- `SUCCESS`: vendor returned a successful response.
- `FAILED`: eligible vendors were tried, but upstream calls failed.
- `TIMEOUT`: eligible vendors were tried, but all timed out.
- `NO_VENDOR_AVAILABLE`: no vendor was registered or eligible after health, feature, threshold, and rate-limit checks.

### GET `/vendor-metrics`

Returns cost, usage, latency, success rate, error rate, and availability per vendor.

### GET `/routing-logs`

Returns request logs and routing decision explanations. Each log includes a `requestId` so one client call can be traced end to end.

### AI assistant APIs

These APIs support the optional AI Assistant page. They do not route traffic; they only generate recommendations and explanations.

- `POST /ai/generate-rule`
- `POST /ai/explain-decision`
- `POST /ai/vendor-insight`

### GET `/health`

Returns service health and implemented routing strategies.

## Extra Config API

### POST `/routing-rules`

Creates or updates the routing strategy and health thresholds for a capability.

### GET `/routing-rules`

Lists configured routing rules.

## Routing Strategies

VendorSwitch implements 7 strong strategies from the assignment list:

- Priority based routing
- Weighted routing
- Lowest latency routing
- Lowest cost routing
- Failover routing
- Feature-based routing
- Health-based routing

## Deliverables

- Source code: included
- README: included
- Sample vendor configs: `sample-configs/sample-vendors.json`
- Sample routing configs: `sample-configs/sample-routing-rule.json`
- Sample route requests/responses: `sample-configs/sample-route-request.json`
- Sample API requests: `sample-requests/api-samples.http`
- AI prompt samples: `sample-configs/sample-ai-prompts.md`
- Architecture diagram: `ARCHITECTURE.md`
- Explanation of routing decisions: `ARCHITECTURE.md`
- AI usage note: `AI_USAGE.md`
