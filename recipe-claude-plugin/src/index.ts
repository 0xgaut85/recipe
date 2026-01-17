#!/usr/bin/env node

/**
 * Claude Trade MCP Server
 * Solana trading plugin for Claude Code
 * 
 * Features:
 * - Auto-generate local wallet (keys stored at ~/.claude-trade/wallet.json)
 * - Search tokens, get prices, trending data
 * - Execute swaps via Jupiter
 * - Strategy templates
 * 
 * All data APIs go through Claude Trade backend - no API keys needed for users.
 * Private keys are generated locally and never leave the user's machine.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { walletTools, handleWalletTool } from "./tools/wallet.js";
import { tokenTools, handleTokenTool } from "./tools/token.js";
import { tradeTools, handleTradeTool } from "./tools/trade.js";
import { strategyTools, handleStrategyTool } from "./tools/strategy.js";
import { getOrCreateWallet, formatWalletInfo } from "./lib/wallet.js";

const server = new Server(
  {
    name: "claude-trade",
    version: "1.0.0",
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
      ...walletTools,
      ...tokenTools,
      ...tradeTools,
      ...strategyTools,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Wallet tools
    if (name.startsWith("claude_trade_wallet_")) {
      return await handleWalletTool(name, args as Record<string, unknown>);
    }

    // Token tools (includes claude_trade_get_* and claude_trade_calculate_* for OHLCV/EMA)
    if (
      name.startsWith("claude_trade_token_") ||
      name.startsWith("claude_trade_get_") ||
      name.startsWith("claude_trade_calculate_")
    ) {
      return await handleTokenTool(name, args as Record<string, unknown>);
    }

    // Trade tools (swap, quick buy/sell, tokens list)
    if (
      name.startsWith("claude_trade_swap_") ||
      name.startsWith("claude_trade_quick_") ||
      name === "claude_trade_tokens_list"
    ) {
      return await handleTradeTool(name, args as Record<string, unknown>);
    }

    // Strategy tools
    if (name.startsWith("claude_trade_strategy_")) {
      return await handleStrategyTool(name, args as Record<string, unknown>);
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
          text: JSON.stringify({
            error: `Error executing ${name}`,
            message: error instanceof Error ? error.message : "Unknown error",
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  // Initialize wallet on startup
  console.error("");
  console.error("═══════════════════════════════════════════════════════════════");
  console.error("  CLAUDE TRADE - CLAUDE CODE PLUGIN");
  console.error("  https://claudetrade.io");
  console.error("═══════════════════════════════════════════════════════════════");
  console.error("");

  // Get or create wallet
  const { wallet, isNew } = getOrCreateWallet();
  console.error(formatWalletInfo(wallet, isNew));

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude Trade MCP server running on stdio");
  console.error("");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
