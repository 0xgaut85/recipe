/**
 * Strategy MCP Tools
 * Create and manage trading strategies - matches main app's claude-tools.ts
 * Supports SNIPER, SPOT, and CONDITIONAL strategy types
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const strategyTools: Tool[] = [
  {
    name: "recipe_strategy_create",
    description:
      "Create and save a trading strategy. Supports spot trades, new pair sniping, and conditional/indicator-based strategies. Use this when the user wants to save/deploy a strategy.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Short name for the strategy",
        },
        description: {
          type: "string",
          description: "Detailed description of what the strategy does",
        },
        type: {
          type: "string",
          enum: ["SPOT", "SNIPER", "CONDITIONAL"],
          description:
            "Type of strategy: SPOT for swaps, SNIPER for new pair sniping, CONDITIONAL for indicator-based triggers",
        },
        inputToken: {
          type: "string",
          description: "Input token symbol or address (e.g., 'SOL', 'BONK')",
        },
        outputToken: {
          type: "string",
          description: "Output token symbol or address (for SPOT trades)",
        },
        amount: {
          type: "number",
          description: "Amount to trade (in input token units, e.g., SOL amount)",
        },
        direction: {
          type: "string",
          enum: ["buy", "sell"],
          description: "Trade direction",
        },
        stopLoss: {
          type: "number",
          description: "Stop loss percentage (optional, omit for no stop loss)",
        },
        takeProfit: {
          type: "number",
          description: "Take profit percentage (optional, omit for manual exit)",
        },
        // SNIPER specific
        maxAgeMinutes: {
          type: "number",
          description: "For SNIPER: Maximum pair age in minutes (e.g., 15 for very fresh)",
        },
        minLiquidity: {
          type: "number",
          description: "For SNIPER: Minimum liquidity in USD (e.g., 10000)",
        },
        maxLiquidity: {
          type: "number",
          description: "For SNIPER: Maximum liquidity in USD (optional)",
        },
        minVolume: {
          type: "number",
          description: "For SNIPER: Minimum 24h volume in USD",
        },
        minMarketCap: {
          type: "number",
          description: "For SNIPER: Minimum market cap in USD (e.g., 100000 for $100k)",
        },
        maxMarketCap: {
          type: "number",
          description: "For SNIPER: Maximum market cap in USD (optional, for microcap plays)",
        },
        nameFilter: {
          type: "string",
          description:
            "For SNIPER: Filter tokens by name containing this string (e.g., 'claude', 'ai')",
        },
        slippageBps: {
          type: "number",
          description: "Slippage tolerance in basis points (default: 300 for 3%)",
        },
        // CONDITIONAL specific
        condition: {
          type: "object",
          description: "For CONDITIONAL: Indicator-based trigger conditions",
          properties: {
            indicator: {
              type: "string",
              enum: ["EMA", "RSI", "SMA", "PRICE"],
              description:
                "Indicator to use (EMA, RSI, SMA, or PRICE for specific price level)",
            },
            period: {
              type: "number",
              description: "Indicator period (e.g., 20, 50, 200 for EMA/SMA)",
            },
            timeframe: {
              type: "string",
              enum: ["1m", "5m", "15m", "1H", "4H", "1D"],
              description: "Candle timeframe for the indicator",
            },
            trigger: {
              type: "string",
              enum: ["price_above", "price_below", "price_touches", "crosses_above", "crosses_below"],
              description: "When to trigger the trade",
            },
            value: {
              type: "number",
              description: "For PRICE indicator: specific price level to trigger at",
            },
          },
        },
      },
      required: ["name", "description", "type"],
    },
  },
  {
    name: "recipe_strategy_list",
    description:
      "Get example strategy configurations for common trading patterns.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["SPOT", "SNIPER", "CONDITIONAL", "all"],
          description: "Filter by strategy type or 'all' for all examples",
        },
      },
    },
  },
  {
    name: "recipe_strategy_validate",
    description: "Validate a strategy configuration for completeness and safety.",
    inputSchema: {
      type: "object",
      properties: {
        strategy: {
          type: "object",
          description: "Strategy configuration to validate",
        },
      },
      required: ["strategy"],
    },
  },
];

// Example strategy configurations matching the main app's API format
// Each example uses the { name, description, config } structure
const STRATEGY_EXAMPLES = {
  SNIPER: {
    name: "AI Token Sniper",
    description: "Snipe new AI-themed tokens on Pump.fun with good liquidity",
    config: {
      type: "SNIPER",
      amount: 0.1,
      maxAgeMinutes: 15,
      minLiquidity: 10000,
      minMarketCap: 50000,
      maxMarketCap: 500000,
      nameFilter: "ai",
      slippageBps: 300,
      takeProfit: 100,
      stopLoss: 30,
    },
  },
  SPOT: {
    name: "SOL to BONK Swap",
    description: "Simple spot swap from SOL to BONK",
    config: {
      type: "SPOT",
      inputToken: "SOL",
      outputToken: "BONK",
      amount: 1,
      direction: "buy",
      slippageBps: 50,
      stopLoss: 10,
      takeProfit: 50,
    },
  },
  CONDITIONAL: {
    name: "Buy BONK on EMA Cross",
    description: "Buy BONK when price crosses above 50 EMA on 4H timeframe",
    config: {
      type: "CONDITIONAL",
      inputToken: "BONK",
      amount: 0.5,
      direction: "buy",
      slippageBps: 100,
      stopLoss: 15,
      takeProfit: 50,
      condition: {
        indicator: "EMA",
        period: 50,
        timeframe: "4H",
        trigger: "crosses_above",
      },
    },
  },
};

export async function handleStrategyTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "recipe_strategy_create": {
      const strategyType = args?.type as string;

      if (!args?.name || !args?.description || !strategyType) {
        return {
          content: [
            {
              type: "text",
              text: "Missing required fields: name, description, and type are required",
            },
          ],
          isError: true,
        };
      }

      if (!["SPOT", "SNIPER", "CONDITIONAL"].includes(strategyType)) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid strategy type: ${strategyType}. Must be SPOT, SNIPER, or CONDITIONAL`,
            },
          ],
          isError: true,
        };
      }

      // Build config based on strategy type - matches app's API schema
      // The app expects: { name, description, config: { type, ...fields } }
      interface StrategyConfig {
        type: string;
        token?: string;
        amount?: number;
        slippageBps: number;
        inputToken?: string;
        outputToken?: string;
        direction?: string;
        stopLoss?: number;
        takeProfit?: number;
        maxAgeMinutes?: number;
        minLiquidity?: number;
        maxLiquidity?: number;
        minVolume?: number;
        minMarketCap?: number;
        maxMarketCap?: number;
        nameFilter?: string;
        condition?: {
          indicator: string;
          period?: number;
          timeframe?: string;
          trigger: string;
          value?: number;
        };
      }

      let config: StrategyConfig = {
        type: strategyType,
        amount: args.amount as number | undefined,
        slippageBps: (args.slippageBps as number) || (strategyType === "SNIPER" ? 300 : 50),
      };

      if (strategyType === "SPOT") {
        if (!args.inputToken || !args.outputToken) {
          return {
            content: [
              {
                type: "text",
                text: "SPOT strategy requires inputToken and outputToken",
              },
            ],
            isError: true,
          };
        }
        config = {
          ...config,
          inputToken: args.inputToken as string,
          outputToken: args.outputToken as string,
          direction: (args.direction as string) || "buy",
          stopLoss: args.stopLoss as number | undefined,
          takeProfit: args.takeProfit as number | undefined,
        };
      } else if (strategyType === "SNIPER") {
        config = {
          ...config,
          maxAgeMinutes: (args.maxAgeMinutes as number) || 30,
          minLiquidity: args.minLiquidity as number | undefined,
          maxLiquidity: args.maxLiquidity as number | undefined,
          minVolume: args.minVolume as number | undefined,
          minMarketCap: args.minMarketCap as number | undefined,
          maxMarketCap: args.maxMarketCap as number | undefined,
          nameFilter: args.nameFilter as string | undefined,
          takeProfit: args.takeProfit as number | undefined,
          stopLoss: args.stopLoss as number | undefined,
        };
      } else if (strategyType === "CONDITIONAL") {
        if (!args.inputToken) {
          return {
            content: [
              {
                type: "text",
                text: "CONDITIONAL strategy requires inputToken",
              },
            ],
            isError: true,
          };
        }

        const conditionArg = args.condition as {
          indicator?: string;
          period?: number;
          timeframe?: string;
          trigger?: string;
          value?: number;
        } | undefined;

        if (!conditionArg) {
          return {
            content: [
              {
                type: "text",
                text: "CONDITIONAL strategy requires a condition object with indicator, period, timeframe, and trigger",
              },
            ],
            isError: true,
          };
        }

        config = {
          ...config,
          inputToken: args.inputToken as string,
          outputToken: args.outputToken as string | undefined,
          direction: (args.direction as string) || "buy",
          stopLoss: args.stopLoss as number | undefined,
          takeProfit: args.takeProfit as number | undefined,
          condition: {
            indicator: conditionArg.indicator || "EMA",
            period: conditionArg.period,
            timeframe: conditionArg.timeframe || "1H",
            trigger: conditionArg.trigger || "price_touches",
            value: conditionArg.value,
          },
        };
      }

      const typeEmoji =
        strategyType === "SNIPER" ? "🎯" : strategyType === "CONDITIONAL" ? "📊" : "💱";

      // Output in the exact format expected by the app's /api/strategies POST endpoint
      // This allows users to directly use this output with the Recipe.money web app
      const strategyPayload = {
        name: args.name as string,
        description: args.description as string,
        config,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                strategy: strategyPayload,
                message: `${typeEmoji} Strategy "${args.name}" created successfully!`,
                note: "This strategy configuration is compatible with the Recipe.money web app API. Use the 'strategy' object directly with POST /api/strategies.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "recipe_strategy_list": {
      const typeFilter = (args?.type as string) || "all";

      let examples: Record<string, unknown>[];

      if (typeFilter === "all") {
        examples = Object.values(STRATEGY_EXAMPLES);
      } else if (typeFilter in STRATEGY_EXAMPLES) {
        examples = [STRATEGY_EXAMPLES[typeFilter as keyof typeof STRATEGY_EXAMPLES]];
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Invalid type filter: ${typeFilter}. Use SPOT, SNIPER, CONDITIONAL, or all`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: examples.length,
                examples,
                usage:
                  "Use recipe_strategy_create with these configurations as templates. Customize the parameters for your needs.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "recipe_strategy_validate": {
      const strategy = args?.strategy as Record<string, unknown>;

      if (!strategy) {
        return {
          content: [{ type: "text", text: "Missing strategy parameter" }],
          isError: true,
        };
      }

      const issues: string[] = [];
      const warnings: string[] = [];

      // Required fields
      if (!strategy.name) {
        issues.push("Missing name");
      }
      if (!strategy.type) {
        issues.push("Missing type - must be SPOT, SNIPER, or CONDITIONAL");
      }
      if (!strategy.amount && strategy.type !== "SNIPER") {
        issues.push("Missing amount - required for SPOT and CONDITIONAL strategies");
      }

      // Type-specific validation
      if (strategy.type === "SPOT") {
        if (!strategy.inputToken) issues.push("SPOT: Missing inputToken");
        if (!strategy.outputToken) issues.push("SPOT: Missing outputToken");
      }

      if (strategy.type === "CONDITIONAL") {
        if (!strategy.inputToken) issues.push("CONDITIONAL: Missing inputToken");
        if (!strategy.condition) issues.push("CONDITIONAL: Missing condition object");
        else {
          const condition = strategy.condition as Record<string, unknown>;
          if (!condition.indicator) issues.push("CONDITIONAL: Missing condition.indicator");
          if (!condition.trigger) issues.push("CONDITIONAL: Missing condition.trigger");
        }
      }

      // Safety warnings
      if (typeof strategy.amount === "number" && (strategy.amount as number) > 10) {
        warnings.push("Large position size (>10 SOL) - consider reducing for safety");
      }

      if (!strategy.stopLoss) {
        warnings.push("No stop loss defined - unlimited downside risk");
      }

      if (typeof strategy.slippageBps === "number" && (strategy.slippageBps as number) > 500) {
        warnings.push("High slippage (>5%) - may result in unfavorable execution");
      }

      const isValid = issues.length === 0;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                valid: isValid,
                issues,
                warnings,
                recommendation: isValid
                  ? "Strategy passes validation. Review warnings before deploying."
                  : "Fix the issues listed above before deploying.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown strategy tool: ${name}` }],
        isError: true,
      };
  }
}
