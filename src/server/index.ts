import "dotenv/config";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerTools } from "./capabilities.js";
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
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
});

app.use(limiter);
app.use(express.json());
app.use(cors({ origin: "*", exposedHeaders: ["Mcp-Session-Id"] }));

// Structured Request Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${Date.now() - start}ms`,
      },
      "HTTP Request",
    );
  });
  next();
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize MCP Server
const server = new McpServer({
  name: "taskup-mcp",
  version: "1.0.0",
});

// Register tools
registerTools(server);

// Store active transports by session ID if needed,
// though SSEServerTransport typically handles the response stream directly.
let transport: SSEServerTransport | null = null;

/**
 * MCP SSE Endpoint
 * Clients connect here to start a Server-Sent Events stream.
 */
app.get("/sse", async (req, res) => {
  logger.info("New MCP SSE connection attempt");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);

  transport.onclose = () => {
    logger.info("MCP SSE connection closed");
    transport = null;
  };
});

/**
 * MCP Messages Endpoint
 * Clients send JSON-RPC messages here.
 */
app.post("/messages", async (req, res) => {
  if (!transport) {
    res.status(400).json({ error: "No active SSE connection" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(port, () => {
  console.log(`🚀 TaskUp MCP Server running on port ${port}`);
  console.log(`📡 SSE Endpoint: http://localhost:${port}/sse`);
  console.log(`✉️ Messages Endpoint: http://localhost:${port}/messages`);
});
