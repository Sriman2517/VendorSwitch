# AI Usage

This project was developed with AI assistance as an engineering productivity tool. AI was used to brainstorm the system design, refine the project structure, review implementation ideas, and improve documentation. All generated code and design decisions were reviewed, modified, tested, and integrated manually.

## Development Approach

The implementation was completed by prioritizing the core evaluation criteria before adding the optional Agentic AI features.

The project includes:

- Rule-based vendor routing and failover logic
- Vendor metrics tracking and health monitoring
- Request and routing decision logging
- Sample vendor configurations and API request examples
- Architecture documentation and routing decision explanations

The application follows a modular MERN architecture with separate models, controllers, routes, services, and utility modules to keep the codebase organized and maintainable.

## Gemini AI Integration

Gemini is used only for the optional **Agentic AI** features and does **not** participate in runtime vendor selection.

The AI Assistant provides the following capabilities:

- Generate routing rules from natural language
- Explain why a particular vendor was selected
- Analyze vendor health and provide recommendations

The routing engine itself remains completely deterministic and rule-based. AI responses are used only to assist administrators and do not influence routing decisions directly.

### AI Endpoints

- `POST /ai/generate-rule`
- `POST /ai/explain-decision`
- `POST /ai/vendor-insight`

## Security

- The Gemini API key is stored only on the backend in `server/.env` as `GEMINI_API_KEY`.
- The React frontend never stores or exposes the API key.
- No production credentials, secrets, or API keys are included in the repository.
- The MongoDB Atlas connection string should be configured locally using the `.env` file.

## Fallback Behavior

If the Gemini API is temporarily unavailable, the backend returns deterministic fallback recommendations so that the AI Assistant remains functional for demonstration purposes. The core routing engine continues to operate normally because all vendor selection decisions are performed using configurable routing rules rather than AI.