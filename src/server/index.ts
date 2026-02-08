import "dotenv/config";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpAuthMetadataRouter, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { registerTools } from "./capabilities.js";
import { oauthMetadata, mcpServerUrl, tokenVerifier } from "./auth.js";
import { logger } from "../utils/logger.js";
import { authStore } from "../utils/auth-store.js";
import rateLimit from "express-rate-limit";

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting for public access safety
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

app.use(limiter);
app.use(express.json());
app.use(cors({ origin: "*", exposedHeaders: ["Mcp-Session-Id"] }));

// Structured Request Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    }, "HTTP Request");
  });
  next();
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth Metadata Router (Protected Resource Metadata)
app.use(mcpAuthMetadataRouter({
  oauthMetadata,
  resourceServerUrl: mcpServerUrl,
  scopesSupported: ["mcp:tools"],
  resourceName: "TaskUp MCP",
}));

const authMiddleware: express.RequestHandler[] = [
  requireBearerAuth({
    verifier: {
      verifyAccessToken: async (token: string) => {
        const info = await tokenVerifier.verifyAccessToken(token);
        return {
          token: info.token,
          clientId: info.clientId,
          scopes: info.scopes,
        };
      }
    },
    requiredScopes: ["mcp:tools"],
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl),
  }),
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.auth) {
      // capture arcade headers if any
      const arcadeUserId = req.headers["arcade-user-id"] as string | undefined;
      authStore.run({
        token: req.auth.token,
        userId: arcadeUserId,
        clientId: req.auth.clientId,
      }, next);
    } else {
      next();
    }
  }
];

// Initialize MCP Server
const server = new McpServer({
  name: "taskup-mcp",
  version: "1.0.0",
});

// Register tools
registerTools(server);

// Map to handle multiple concurrent SSE sessions
const transports = new Map<string, SSEServerTransport>();

/**
 * MCP SSE Endpoint
 * Clients connect here to start a Server-Sent Events stream.
 */
app.get("/sse", authMiddleware, async (req: express.Request, res: express.Response) => {
  logger.info("New MCP SSE connection attempt");
  
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
  
  const sessionId = transport.sessionId;
  transports.set(sessionId, transport);
  logger.info({ sessionId }, "Created new MCP SSE session");
  
  transport.onclose = () => {
    logger.info({ sessionId }, "MCP SSE connection closed");
    transports.delete(sessionId);
  };
});

/**
 * MCP Messages Endpoint
 * Clients send JSON-RPC messages here.
 */
app.post("/messages", authMiddleware, async (req: express.Request, res: express.Response) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    logger.warn({ sessionId }, "Received message for unknown MCP session");
    res.status(404).json({ error: "Unknown session" });
    return;
  }

  await transport.handlePostMessage(req, res);
});

app.listen(port, () => {
  console.log(`🚀 TaskUp MCP Server running on port ${port}`);
  console.log(`📡 SSE Endpoint: http://localhost:${port}/sse`);
  console.log(`✉️ Messages Endpoint: http://localhost:${port}/messages`);
});
