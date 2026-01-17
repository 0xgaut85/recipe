#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { tokenTools, handleTokenTool } from "./tools/token.js";
import { walletTools, handleWalletTool } from "./tools/wallet.js";
import { quoteTools, handleQuoteTool } from "./tools/quote.js";
import { strategyTools, handleStrategyTool } from "./tools/strategy.js";
import { indicatorTools } from "./tools/indicators.js";
import { tradeTools } from "./tools/trade.js";
import {
  getOrCreateWallet,
  displayWalletInfo,
  loadWallet,
} from "./lib/local-wallet.js";

const server = new Server(
  {
    name: "claude-trade-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...tokenTools,
      ...walletTools,
      ...quoteTools,
      ...strategyTools,
      ...indicatorTools.map((t) => t.definition),
      ...tradeTools.map((t) => t.definition),
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Token tools
    if (name.startsWith("claude_trade_token_")) {
      return await handleTokenTool(name, args);
    }

    // Wallet tools
    if (name.startsWith("claude_trade_wallet_")) {
      return await handleWalletTool(name, args);
    }

    // Quote tools
    if (name.startsWith("claude_trade_quote_")) {
      return await handleQuoteTool(name, args);
    }

    // Strategy tools
    if (name.startsWith("claude_trade_strategy_")) {
      return await handleStrategyTool(name, args);
    }

    // Indicator tools
    const indicatorTool = indicatorTools.find((t) => t.definition.name === name);
    if (indicatorTool) {
      const result = await indicatorTool.handler(args as any);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Trade tools
    const tradeTool = tradeTools.find((t) => t.definition.name === name);
    if (tradeTool) {
      const result = await tradeTool.handler(args as any);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  // Initialize wallet on startup
  console.error("\n");
  console.error("═══════════════════════════════════════════════════════════════");
  console.error("  CLAUDE TRADE - CLAUDE CODE PLUGIN");
  console.error("═══════════════════════════════════════════════════════════════");
  console.error("\n");

  // Get or create wallet
  const { wallet, isNew } = getOrCreateWallet();
  console.error(displayWalletInfo(wallet, isNew));

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude Trade MCP server running on stdio");
  console.error("\n");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
