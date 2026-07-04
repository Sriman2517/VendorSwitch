# AI Usage

AI assistance was used to structure and implement this assignment. The generated code was reviewed and organized into a clean MERN project with separate models, controllers, routes, services, sample configs, and documentation.

Core implementation decisions:

- Prioritized the 95-mark core evaluation criteria before the 5-mark agentic AI bonus.
- Implemented routing and failover in `server/src/services/routingEngine.js`.
- Added metrics tracking through request logs and vendor health updates.
- Added sample configs and API requests so evaluators can test the project quickly.

No real production secrets are included. The MongoDB Atlas URI should be added locally in `server/.env`.

Gemini API integration:

- The Gemini API key is read only on the backend from `server/.env` as `GEMINI_API_KEY`.
- The React frontend never stores or sends the API key.
- AI assistant routes are exposed under `/ai`:
  - `POST /ai/generate-rule`
  - `POST /ai/explain-decision`
  - `POST /ai/vendor-insight`
- The routing engine remains rule-based. AI responses are used only to recommend, explain, and help configure routing rules.
- If Gemini is temporarily unavailable, the backend returns deterministic fallback recommendations so the demo page still works.
