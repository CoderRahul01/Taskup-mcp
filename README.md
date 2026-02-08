# TaskUp MCP Server [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade Model Context Protocol (MCP) server for centralized workspace orchestration. This server provides tools to analyze user intent and perform actions across Notion, Google Calendar, and Telegram.

## 🚀 Multi-Client Configuration Guide

Connect TaskUp MCP to your favorite AI tools using the configurations below.

### 1. Claude Desktop (Universal Compatibility Fix)

Claude Desktop sometimes requires a `command` field and may fail with a direct SSE URL. Use this configuration to connect via the built-in compatibility proxy:

```json
{
  "mcpServers": {
    "taskup": {
      "command": "bun",
      "args": [
        "run",
        "/Users/rahulpandey187/Documents/future-products/Alumnx/MCP/taskup-mcp/src/server/proxy.ts"
      ],
      "env": {
        "REMOTE_URL": "https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse",
        "ARCADE_TOKEN": "YOUR_ARCADE_TOKEN"
      }
    }
  }
}
```

> [!IMPORTANT]
> Replace the path in `args` with the absolute path to your local `proxy.ts` file.

### 2. Cursor / Windsurf / ChatGPT

These clients support direct SSE URLs natively:

- **URL**: `https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse`
- **Type**: SSE

### 3. Zed Editor

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

- **Multi-Session Safe**: Supports concurrent sessions via sessionId routing.
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
