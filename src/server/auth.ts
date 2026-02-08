import { logger } from "../utils/logger.js";

export const tokenVerifier = {
  /**
   * Verified Arcade tokens or API keys passed via headers.
   * Arcade Gateways pass user identity via headers in 'Arcade Headers' mode.
   */
  verifyAccessToken: async (token: string) => {
    try {
      // In Arcade Auth mode, we might verify the token here.
      // For managed Arcade Gateway (Headers mode), the gateway handles verification.
      return {
        token,
        clientId: "arcade",
        scopes: ["mcp:tools"],
      };
    } catch (error: any) {
      logger.error({ error: error.message }, "Auth Verification Failed");
      throw new Error("Unauthorized", { cause: error });
    }
  },
};

export const mcpServerUrl = new URL(process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`);

// Arcade serves as the metadata provider if using Gateways, 
// so we provide standard OpenID Connect metadata.
export const oauthMetadata = {
  issuer: "https://api.arcade.dev",
  authorization_endpoint: "https://api.arcade.dev/oauth/authorize",
  token_endpoint: "https://api.arcade.dev/oauth/token",
  response_types_supported: ["code"],
  scopes_supported: ["mcp:tools"],
};
