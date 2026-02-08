# TaskUp MCP Server [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade Model Context Protocol (MCP) server for centralized workspace orchestration. This server provides tools to analyze user intent and perform actions across Notion, Google Calendar, and Telegram.

## 🚀 Public Access (Quick Connect)

You can connect to this server instantly from any MCP-compliant client.

- **URL**: `https://personal-execution-mcp-vfh76wyjna-uc.a.run.app`
- **Specification**: MCP 2025-11-25

### Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taskup": {
      "url": "https://personal-execution-mcp-vfh76wyjna-uc.a.run.app"
    }
  }
}
```

### Cursor Configuration

1. Open Cursor Settings -> Models -> MCP.
2. Add a new server.
3. Set Name to `TaskUp`.
4. Set Type to `SSE`.
5. Set URL to `https://personal-execution-mcp-vfh76wyjna-uc.a.run.app`.

## Architecture

- **Transport**: SSE (Server-Sent Events)
- **Security**: OAuth 2.1 (Bearer Auth with JWKS/Introspection)
- **Intelligence**: LangGraph + Hugging Face (Mistral-7B)
- **Integrations**: Notion, Google Calendar, Telegram

## Tools

### 1. `analyze_intent`

Converts natural language into a structured execution plan.

- **Input**: `{ "text": string }`
- **Output**: JSON containing extracted tasks, meetings, and notifications.

### 2. `create_notion_task`

Creates a task in a Notion database.

- **Idempotency**: Checks for duplicate titles before creation.

### 3. `schedule_calendar_event`

Schedules a Google Calendar event with a meeting link.

### 4. `send_telegram_notification`

Sends instant messages or schedules reminders via Telegram.

## Setup

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your API keys.

3. **Run Server**:
   ```bash
   bun run src/server/index.ts
   ```

## Deployment

This server is designed to run on **Google Cloud Run**. A one-click deployment script is provided:

1. Ensure you have the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and initialized.
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
   _This will build the image via Cloud Build and deploy it to a public Cloud Run URL._

## Production Readiness

- **Stateless**: No session state stored on server; fully delegated to OAuth tokens.
- **Schema-Driven**: Strict Zod validation for all inputs and outputs.
- **Spec-Compliant**: Follows the 2025-11-25 MCP specification.
- **Isolated Integrations**: Each service adapter is modular and independent.
- **Observability**: Structured JSON logging using `pino`.
- **Health Checks**: Endpoint available at `/health`.
- **Dockerized**: Production-ready `Dockerfile` included.

## How to Test

1. Configure `.env` using `.env.example`.
2. Run the server: `bun run src/server/index.ts`.
3. Connect using an MCP client (e.g., Claude Desktop) to `http://localhost:3000`.
4. Verify health: `curl http://localhost:3000/health`.
