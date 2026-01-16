/**
 * Strategy MCP Tools
 * Strategy templates and configuration
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

interface StrategyTemplate {
  name: string;
  category: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: unknown;
  }>;
  example: Record<string, unknown>;
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    name: "volume_spike_entry",
    category: "momentum",
    description: "Enter positions when volume spikes above a threshold, indicating potential momentum.",
    parameters: [
      { name: "token", type: "string", description: "Token to trade", required: true },
      { name: "volumeMultiplier", type: "number", description: "Volume spike threshold (e.g., 3x average)", required: true, default: 3 },
      { name: "lookbackPeriod", type: "string", description: "Period to calculate average volume", required: false, default: "1h" },
      { name: "positionSize", type: "number", description: "Position size in SOL", required: true },
      { name: "stopLoss", type: "number", description: "Stop loss percentage", required: false, default: 10 },
      { name: "takeProfit", type: "number", description: "Take profit percentage", required: false, default: 30 },
    ],
    example: {
      token: "BONK",
      volumeMultiplier: 3,
      lookbackPeriod: "1h",
      positionSize: 1,
      stopLoss: 10,
      takeProfit: 30,
    },
  },
  {
    name: "new_token_sniper",
    category: "momentum",
    description: "Automatically enter new Pump.fun launches based on criteria like market cap and social signals.",
    parameters: [
      { name: "minMarketCap", type: "number", description: "Minimum market cap to enter", required: false, default: 5000 },
      { name: "maxMarketCap", type: "number", description: "Maximum market cap to enter", required: false, default: 100000 },
      { name: "positionSize", type: "number", description: "Position size in SOL", required: true },
      { name: "requireTwitter", type: "boolean", description: "Require Twitter link", required: false, default: false },
      { name: "requireTelegram", type: "boolean", description: "Require Telegram link", required: false, default: false },
      { name: "exitOnMigration", type: "boolean", description: "Exit when token migrates to Raydium", required: false, default: true },
    ],
    example: {
      minMarketCap: 5000,
      maxMarketCap: 50000,
      positionSize: 0.5,
      requireTwitter: true,
      exitOnMigration: true,
    },
  },
  {
    name: "dip_buyer",
    category: "mean_reversion",
    description: "Buy tokens after significant price drops, betting on mean reversion.",
    parameters: [
      { name: "token", type: "string", description: "Token to trade", required: true },
      { name: "dropThreshold", type: "number", description: "Minimum price drop percentage to trigger", required: true, default: 20 },
      { name: "timeframe", type: "string", description: "Timeframe for price drop calculation", required: false, default: "24h" },
      { name: "positionSize", type: "number", description: "Position size in SOL", required: true },
      { name: "dcaSteps", type: "number", description: "Number of DCA steps if price continues dropping", required: false, default: 3 },
    ],
    example: {
      token: "SOL",
      dropThreshold: 15,
      timeframe: "24h",
      positionSize: 2,
      dcaSteps: 3,
    },
  },
  {
    name: "wallet_copy",
    category: "copy_trading",
    description: "Copy trades from a target wallet address with customizable delay and position sizing.",
    parameters: [
      { name: "targetWallet", type: "string", description: "Wallet address to copy", required: true },
      { name: "copyDelay", type: "number", description: "Delay in seconds before copying (0 for immediate)", required: false, default: 0 },
      { name: "positionMultiplier", type: "number", description: "Multiply target's position size by this factor", required: false, default: 1 },
      { name: "maxPositionSize", type: "number", description: "Maximum position size in SOL", required: true },
      { name: "excludeTokens", type: "array", description: "Token addresses to exclude from copying", required: false },
      { name: "onlyBuys", type: "boolean", description: "Only copy buy transactions", required: false, default: false },
    ],
    example: {
      targetWallet: "ABC...XYZ",
      copyDelay: 5,
      positionMultiplier: 0.5,
      maxPositionSize: 5,
      onlyBuys: true,
    },
  },
  {
    name: "grid_trading",
    category: "range_trading",
    description: "Place buy and sell orders at regular intervals within a price range.",
    parameters: [
      { name: "token", type: "string", description: "Token to trade", required: true },
      { name: "lowerPrice", type: "number", description: "Lower bound of price range", required: true },
      { name: "upperPrice", type: "number", description: "Upper bound of price range", required: true },
      { name: "gridLevels", type: "number", description: "Number of grid levels", required: true, default: 10 },
      { name: "positionSize", type: "number", description: "Total position size in SOL", required: true },
    ],
    example: {
      token: "SOL",
      lowerPrice: 100,
      upperPrice: 200,
      gridLevels: 10,
      positionSize: 5,
    },
  },
];

export const strategyTools: Tool[] = [
  {
    name: "recipe_strategy_list",
    description:
      "Get available strategy templates for common trading patterns. Each template includes description, parameters, and example configuration.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["momentum", "mean_reversion", "copy_trading", "range_trading", "all"],
          description: "Filter by category or 'all' for all templates",
        },
      },
    },
  },
  {
    name: "recipe_strategy_create",
    description:
      "Create a strategy configuration from a template with custom parameters. Returns a complete strategy config.",
    inputSchema: {
      type: "object",
      properties: {
        template: {
          type: "string",
          description: "Template name to use (e.g., 'volume_spike_entry', 'new_token_sniper')",
        },
        parameters: {
          type: "object",
          description: "Custom parameters for the strategy",
        },
      },
      required: ["template"],
    },
  },
  {
    name: "recipe_strategy_validate",
    description:
      "Validate a strategy configuration for completeness and safety.",
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

export async function handleStrategyTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "recipe_strategy_list": {
      const category = (args?.category as string) || "all";

      const filtered = category === "all"
        ? STRATEGY_TEMPLATES
        : STRATEGY_TEMPLATES.filter((t) => t.category === category);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: filtered.length,
              templates: filtered.map((t) => ({
                name: t.name,
                category: t.category,
                description: t.description,
                requiredParams: t.parameters.filter((p) => p.required).map((p) => p.name),
                optionalParams: t.parameters.filter((p) => !p.required).map((p) => p.name),
                example: t.example,
              })),
            }, null, 2),
          },
        ],
      };
    }

    case "recipe_strategy_create": {
      const templateName = args?.template as string;
      const customParams = (args?.parameters as Record<string, unknown>) || {};

      if (!templateName) {
        return {
          content: [{ type: "text", text: "Missing template parameter" }],
          isError: true,
        };
      }

      const template = STRATEGY_TEMPLATES.find((t) => t.name === templateName);

      if (!template) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Template '${templateName}' not found`,
                available: STRATEGY_TEMPLATES.map((t) => t.name),
              }, null, 2),
            },
          ],
          isError: true,
        };
      }

      // Merge defaults with custom params
      const config: Record<string, unknown> = {};
      for (const param of template.parameters) {
        if (customParams[param.name] !== undefined) {
          config[param.name] = customParams[param.name];
        } else if (param.default !== undefined) {
          config[param.name] = param.default;
        }
      }

      // Check required params
      const missing = template.parameters
        .filter((p) => p.required && config[p.name] === undefined)
        .map((p) => p.name);

      if (missing.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Missing required parameters",
                missing,
                template: template.name,
                example: template.example,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              template: template.name,
              category: template.category,
              description: template.description,
              config,
              status: "ready",
              note: "This is a strategy configuration. Use the Recipe.money web app to deploy and run strategies.",
            }, null, 2),
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

      // Basic validation
      if (!strategy.positionSize) {
        issues.push("Missing positionSize - required for risk management");
      }

      if (typeof strategy.positionSize === "number" && strategy.positionSize > 10) {
        warnings.push("Large position size (>10 SOL) - consider reducing for safety");
      }

      if (!strategy.stopLoss && !strategy.maxLoss) {
        warnings.push("No stop loss defined - unlimited downside risk");
      }

      const isValid = issues.length === 0;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: isValid,
              issues,
              warnings,
              recommendation: isValid
                ? "Strategy passes basic validation. Review warnings before deploying."
                : "Fix issues before deploying strategy.",
            }, null, 2),
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
