import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { mcpAuthMetadataRouter, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { registerTools } from "./capabilities.js";
import { oauthMetadata, mcpServerUrl, tokenVerifier } from "./auth.js";
import { logger } from "../utils/logger.js";

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
  resourceName: "Personal Execution MCP",
}));

import { authStore } from "../utils/auth-store.js";

const authMiddleware = [
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

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const mcpPostHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  try {
    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
          logger.info({ sessionId: sid }, "MCP Session Initialized");
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          logger.info({ sessionId: transport.sessionId }, "MCP Session Closed");
          delete transports[transport.sessionId];
        }
      };

      const server = new McpServer({
        name: "personal-execution-mcp",
        version: "1.0.0",
      });

      registerTools(server);
      await server.connect(transport);
    } else {
      res.status(400).json({ error: "Invalid session or initialization request" });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, "MCP Request Error");
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid session");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
};

app.post("/", authMiddleware, mcpPostHandler);
app.get("/", authMiddleware, handleSessionRequest);
app.delete("/", authMiddleware, handleSessionRequest);

app.listen(port, () => {
  console.log(`🚀 MCP Server running on http://localhost:${port}`);
});
