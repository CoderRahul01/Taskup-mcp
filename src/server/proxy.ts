import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Universal Stdio-to-SSE Proxy
 * 
 * This script runs locally via Claude Desktop's 'command' field.
 * It connects to the remote SSE server and pipes all JSON-RPC traffic
 * through local stdio.
 */

async function main() {
  const remoteUrl = process.env.REMOTE_URL || "https://personal-execution-mcp-vfh76wyjna-uc.a.run.app/sse";
  const bearerToken = process.env.ARCADE_TOKEN;

  console.error(`🚀 TaskUp Proxy starting...`);
  console.error(`📡 Connecting to remote SSE: ${remoteUrl}`);

  // 1. Setup Remote Transport
  const remoteTransport = new SSEClientTransport(new URL(remoteUrl), {
    eventSourceInit: bearerToken ? {
      headers: {
        "Authorization": `Bearer ${bearerToken}`
      }
    } : undefined,
    requestInit: bearerToken ? {
      headers: {
        "Authorization": `Bearer ${bearerToken}`
      }
    } : undefined
  });

  // 2. Setup Local Stdio Transport (What Claude sees)
  const localTransport = new StdioServerTransport();

  // 3. Simple Pipe Logic
  // We don't need a full Client/Server instance here if we just want to bridge.
  // However, using the SDK's transport.onmessage is cleaner.

  remoteTransport.onmessage = (message: JSONRPCMessage) => {
    localTransport.send(message).catch(err => {
      console.error("Local send error:", err);
    });
  };

  localTransport.onmessage = (message: JSONRPCMessage) => {
    remoteTransport.send(message).catch(err => {
      console.error("Remote send error:", err);
    });
  };

  // Connect local first
  await localTransport.start();
  
  // Connect remote
  try {
    await remoteTransport.start();
    console.error("✅ Connected to remote TaskUp server.");
  } catch (error) {
    console.error("❌ Failed to connect to remote server:", error);
    process.exit(1);
  }

  // Handle cleanup
  localTransport.onclose = () => {
    console.error("Local connection closed.");
    process.exit(0);
  };

  remoteTransport.onclose = () => {
    console.error("Remote connection closed.");
    process.exit(0);
  };
}

main().catch(err => {
  console.error("Proxy Error:", err);
  process.exit(1);
});
