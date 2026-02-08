import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

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
  // Note: We use 'any' for options because some EventSource polyfills support 'headers'
  // but the standard DOM EventSourceInit type does not.
  const remoteTransport = new SSEClientTransport(new URL(remoteUrl), {
    eventSourceInit: bearerToken ? {
      headers: {
        "Authorization": `Bearer ${bearerToken}`
      }
    } as Record<string, unknown> as EventSourceInit : undefined,
    requestInit: bearerToken ? {
      headers: {
        "Authorization": `Bearer ${bearerToken}`
      }
    } : undefined
  });

  // 2. Setup Local Stdio Transport (What Claude sees)
  const localTransport = new StdioServerTransport();

  // 3. Simple Pipe Logic
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
