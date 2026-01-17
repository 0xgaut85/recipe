import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  getTokenBalances,
  getSolBalance,
  getTransactionHistory,
  analyzeWallet,
} from "../lib/helius.js";

export const walletTools: Tool[] = [
  {
    name: "claude_trade_wallet_balances",
    description: "Get token balances for a Solana wallet address. Returns SOL and all SPL token holdings.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Solana wallet address",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "claude_trade_wallet_transactions",
    description: "Get recent transaction history for a wallet. Shows swaps, transfers, and other activity.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Solana wallet address",
        },
        limit: {
          type: "number",
          description: "Number of transactions to return (default: 20, max: 100)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "claude_trade_wallet_analyze",
    description: "Analyze a wallet's trading behavior and patterns. Returns activity metrics, swap counts, and holdings summary.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Solana wallet address to analyze",
        },
      },
      required: ["address"],
    },
  },
];

export async function handleWalletTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const address = args?.address as string;

  if (!address) {
    return {
      content: [{ type: "text", text: "Missing address parameter" }],
      isError: true,
    };
  }

  switch (name) {
    case "claude_trade_wallet_balances": {
      const [solBalance, tokenBalances] = await Promise.all([
        getSolBalance(address),
        getTokenBalances(address),
      ]);

      const nonZeroBalances = tokenBalances.filter((b) => b.amount > 0);

      const result = {
        address,
        solBalance,
        tokens: nonZeroBalances,
        totalTokens: nonZeroBalances.length,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "claude_trade_wallet_transactions": {
      const limit = Math.min((args?.limit as number) || 20, 100);
      const transactions = await getTransactionHistory(address, limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                address,
                count: transactions.length,
                transactions: transactions.map((tx) => ({
                  signature: tx.signature,
                  timestamp: new Date(tx.timestamp * 1000).toISOString(),
                  type: tx.type,
                  source: tx.source,
                  description: tx.description,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "claude_trade_wallet_analyze": {
      const analysis = await analyzeWallet(address);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown wallet tool: ${name}` }],
        isError: true,
      };
  }
}
