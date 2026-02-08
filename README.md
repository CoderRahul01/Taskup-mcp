# TaskUp MCP Server [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade Model Context Protocol (MCP) server for centralized workspace orchestration. This server provides tools to analyze user intent and perform actions across Notion, Google Calendar, and Telegram.

## 🚀 Multi-Client Configuration Guide

Connect TaskUp MCP to your favorite AI tools using the configurations below.

### 1. Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taskup": {
      "url": "https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse"
    }
  }
}
```

### 2. Cursor / Windsurf

- **Cursor**: Open Settings -> Models -> MCP -> Add New Server. Set type to `SSE` and URL to `https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse`.
- **Windsurf**: Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "taskup": {
      "url": "https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse"
    }
  }
}
```

### 3. ChatGPT (Connectors)

1. Go to ChatGPT Settings -> Connectors.
2. Click **Add Remote Server**.
3. Enter the URL: `https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse`.

### 4. Zed Editor

Add this to your `settings.json`:

```json
{
  "context_servers": [
    {
      "name": "taskup",
      "url": "https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse"
    }
  ]
}
```

## Architecture

- **Transport**: SSE (Server-Sent Events)
- **Security**: OAuth 2.1 (Arcade Bearer Auth)
- **Intelligence**: LangGraph + Hugging Face (Mistral-7B)
- **Integrations**: Notion, Google Calendar, Telegram

## Production Readiness

- **Stateless**: No session state stored on server; fully delegated to OAuth tokens.
- **Schema-Driven**: Strict Zod validation for all inputs and outputs.
- **Spec-Compliant**: Follows the 2025-11-25 MCP specification.
- **Observability**: Structured JSON logging using `pino`.
- **Health Checks**: Endpoint available at `/health`.

## How to Test Locally

1. Configure `.env` using `.env.example`.
2. Run the server: `bun run src/server/index.ts`.
3. Connect using an MCP client to `http://localhost:3000/sse`.
4. Verify health: `curl http://localhost:3000/health`.
