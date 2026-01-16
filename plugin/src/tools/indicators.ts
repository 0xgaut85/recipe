/**
 * Technical Indicator Tools for Plugin
 */

import { z } from "zod";
import { getOHLCV, TimeFrame, OHLCVCandle } from "../lib/birdeye";

// Calculate EMA
function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    if (i === period - 1) {
      result.push(ema);
      continue;
    }
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

// Calculate RSI
function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
      continue;
    }

    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      result.push(100);
      continue;
    }

    const rs = avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  return result;
}

// Tool schemas
const emaSchema = z.object({
  token: z.string().describe("Token mint address"),
  period: z.number().describe("EMA period (e.g., 20, 50, 100, 200)"),
  timeframe: z.enum(["1m", "5m", "15m", "1H", "4H", "1D"]).optional(),
});

const rsiSchema = z.object({
  token: z.string().describe("Token mint address"),
  period: z.number().optional().default(14),
  timeframe: z.enum(["1m", "5m", "15m", "1H", "4H", "1D"]).optional(),
});

const indicatorsSchema = z.object({
  token: z.string().describe("Token mint address"),
  timeframe: z.enum(["1m", "5m", "15m", "1H", "4H", "1D"]).optional(),
});

export const indicatorTools = [
  {
    definition: {
      name: "calculate_ema",
      description: "Calculate EMA (Exponential Moving Average) for a token",
      input_schema: {
        type: "object" as const,
        properties: {
          token: { type: "string", description: "Token mint address" },
          period: { type: "number", description: "EMA period (e.g., 20, 50, 100, 200)" },
          timeframe: {
            type: "string",
            enum: ["1m", "5m", "15m", "1H", "4H", "1D"],
            description: "Candle timeframe (default: 4H)",
          },
        },
        required: ["token", "period"],
      },
    },
    handler: async (args: z.infer<typeof emaSchema>) => {
      const timeframe = (args.timeframe || "4H") as TimeFrame;
      const candles = await getOHLCV(args.token, timeframe, args.period + 50);
      const closes = candles.map((c) => c.close);
      const ema = calculateEMA(closes, args.period);
      const currentEMA = ema[ema.length - 1];
      const currentPrice = closes[closes.length - 1];

      return {
        period: args.period,
        timeframe,
        currentEMA,
        currentPrice,
        priceAboveEMA: currentPrice > currentEMA,
        percentFromEMA: ((currentPrice - currentEMA) / currentEMA) * 100,
      };
    },
  },
  {
    definition: {
      name: "calculate_rsi",
      description: "Calculate RSI (Relative Strength Index) for a token",
      input_schema: {
        type: "object" as const,
        properties: {
          token: { type: "string", description: "Token mint address" },
          period: { type: "number", description: "RSI period (default: 14)" },
          timeframe: {
            type: "string",
            enum: ["1m", "5m", "15m", "1H", "4H", "1D"],
            description: "Candle timeframe (default: 4H)",
          },
        },
        required: ["token"],
      },
    },
    handler: async (args: z.infer<typeof rsiSchema>) => {
      const timeframe = (args.timeframe || "4H") as TimeFrame;
      const period = args.period || 14;
      const candles = await getOHLCV(args.token, timeframe, period + 50);
      const closes = candles.map((c) => c.close);
      const rsi = calculateRSI(closes, period);
      const currentRSI = rsi[rsi.length - 1];

      return {
        period,
        timeframe,
        currentRSI,
        isOversold: currentRSI < 30,
        isOverbought: currentRSI > 70,
        signal:
          currentRSI < 30
            ? "oversold - potential buy"
            : currentRSI > 70
            ? "overbought - potential sell"
            : "neutral",
      };
    },
  },
  {
    definition: {
      name: "get_all_indicators",
      description: "Get all major technical indicators for a token at once",
      input_schema: {
        type: "object" as const,
        properties: {
          token: { type: "string", description: "Token mint address" },
          timeframe: {
            type: "string",
            enum: ["1m", "5m", "15m", "1H", "4H", "1D"],
            description: "Candle timeframe (default: 4H)",
          },
        },
        required: ["token"],
      },
    },
    handler: async (args: z.infer<typeof indicatorsSchema>) => {
      const timeframe = (args.timeframe || "4H") as TimeFrame;
      const candles = await getOHLCV(args.token, timeframe, 250);
      const closes = candles.map((c) => c.close);

      const ema20 = calculateEMA(closes, 20);
      const ema50 = calculateEMA(closes, 50);
      const ema100 = calculateEMA(closes, 100);
      const ema200 = calculateEMA(closes, 200);
      const rsi14 = calculateRSI(closes, 14);

      const currentPrice = closes[closes.length - 1];

      return {
        timeframe,
        price: currentPrice,
        ema20: ema20[ema20.length - 1],
        ema50: ema50[ema50.length - 1],
        ema100: ema100[ema100.length - 1],
        ema200: ema200[ema200.length - 1],
        rsi14: rsi14[rsi14.length - 1],
        signals: {
          priceAboveEma20: currentPrice > ema20[ema20.length - 1],
          priceAboveEma50: currentPrice > ema50[ema50.length - 1],
          priceAboveEma100: currentPrice > ema100[ema100.length - 1],
          priceAboveEma200: currentPrice > ema200[ema200.length - 1],
          rsiOversold: rsi14[rsi14.length - 1] < 30,
          rsiOverbought: rsi14[rsi14.length - 1] > 70,
        },
      };
    },
  },
];
