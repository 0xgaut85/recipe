/**
 * Strategy Executor
 * Checks active strategies and executes trades when conditions are met
 */

import prisma from "./prisma";
import { getNewPairsFiltered, NewPairData, getOHLCV } from "./birdeye";
import { executeSwap, getSwapQuote, toSmallestUnit, fromSmallestUnit, TOKEN_MINTS } from "./jupiter";
import { decrypt } from "./encryption";
import { calculateEMA, calculateRSI } from "./indicators";

export interface ConditionConfig {
  indicator: "EMA" | "RSI" | "SMA" | "PRICE";
  period?: number;
  timeframe?: string;
  trigger: "price_above" | "price_below" | "price_touches" | "crosses_above" | "crosses_below";
  value?: number;
}

export interface StrategyConfig {
  type: "SNIPER" | "SPOT" | "CONDITIONAL";
  // Sniper config
  maxAgeMinutes?: number;
  minLiquidity?: number;
  maxLiquidity?: number;
  minVolume?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  nameFilter?: string;
  amount?: number; // SOL amount to buy
  slippageBps?: number;
  // Common
  inputToken?: string;
  outputToken?: string;
  direction?: string;
  stopLoss?: number;
  takeProfit?: number;
  // Conditional specific
  condition?: ConditionConfig;
}

export interface ExecutionResult {
  strategyId: string;
  strategyName: string;
  action: "TRADE_EXECUTED" | "NO_OPPORTUNITIES" | "ALREADY_BOUGHT" | "ERROR";
  details?: string;
  trade?: {
    signature: string;
    tokenAddress: string;
    tokenSymbol: string;
    inputAmount: number;
    outputAmount: number;
  };
  error?: string;
}

/**
 * Check and execute all active strategies for a user
 */
export async function checkAndExecuteStrategies(userId: string): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  // Get active strategies for user
  const strategies = await prisma.strategy.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  if (strategies.length === 0) {
    return results;
  }

  // Get user's wallet
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user?.wallet) {
    return strategies.map((s) => ({
      strategyId: s.id,
      strategyName: s.name,
      action: "ERROR" as const,
      error: "Wallet not found",
    }));
  }

  // Get recent trades to avoid buying same token twice
  const recentTrades = await prisma.trade.findMany({
    where: {
      userId,
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
      status: "CONFIRMED",
    },
    select: { outputToken: true },
  });
  const boughtTokens = new Set(recentTrades.map((t) => t.outputToken));

  // Execute each strategy
  for (const strategy of strategies) {
    const config = strategy.config as unknown as StrategyConfig;
    
    try {
      if (config.type === "SNIPER") {
        const result = await executeSniperStrategy(
          strategy.id,
          strategy.name,
          config,
          user.wallet.encryptedPrivateKey,
          userId,
          boughtTokens
        );
        results.push(result);
        
        // Add any bought tokens to the set
        if (result.trade) {
          boughtTokens.add(result.trade.tokenAddress);
        }
      } else if (config.type === "CONDITIONAL") {
        const result = await executeConditionalStrategy(
          strategy.id,
          strategy.name,
          config,
          user.wallet.encryptedPrivateKey,
          userId
        );
        results.push(result);
      } else {
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          action: "NO_OPPORTUNITIES",
          details: `Strategy type ${config.type} execution coming soon`,
        });
      }
    } catch (error) {
      results.push({
        strategyId: strategy.id,
        strategyName: strategy.name,
        action: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Execute a sniper strategy - buy new pairs matching criteria
 */
async function executeSniperStrategy(
  strategyId: string,
  strategyName: string,
  config: StrategyConfig,
  encryptedPrivateKey: string,
  userId: string,
  boughtTokens: Set<string>
): Promise<ExecutionResult> {
  console.log(`[Sniper] Executing strategy: ${strategyName}`);
  console.log(`[Sniper] Config:`, {
    maxAge: config.maxAgeMinutes,
    minLiq: config.minLiquidity,
    nameFilter: config.nameFilter,
    amount: config.amount,
  });

  // Get new pairs matching criteria
  // Use lower defaults to catch more opportunities
  const filterOptions = {
    maxAgeMinutes: config.maxAgeMinutes || 60,
    minLiquidity: config.minLiquidity ?? 1000, // Lower default: $1k
    maxLiquidity: config.maxLiquidity,
    minVolume: config.minVolume ?? 0,
    minMarketCap: config.minMarketCap ?? 0,
    maxMarketCap: config.maxMarketCap,
    limit: 20,
  };
  
  console.log(`[Sniper] Filter options:`, filterOptions);
  
  const newPairs = await getNewPairsFiltered(filterOptions);

  console.log(`[Sniper] Found ${newPairs.length} new pairs from Birdeye`);
  
  if (newPairs.length === 0) {
    return {
      strategyId,
      strategyName,
      action: "NO_OPPORTUNITIES",
      details: "No new pairs matching criteria",
    };
  }

  // Apply name filter if specified
  let filteredPairs = newPairs;
  if (config.nameFilter) {
    const filterLower = config.nameFilter.toLowerCase().trim();
    console.log(`[Sniper] Applying name filter: "${filterLower}" (length: ${filterLower.length})`);
    
    // Check if filter is a single letter (starts with filter)
    if (filterLower.length === 1) {
      filteredPairs = newPairs.filter(
        (pair) =>
          pair.name.toLowerCase().startsWith(filterLower) ||
          pair.symbol.toLowerCase().startsWith(filterLower)
      );
      console.log(`[Sniper] Single-letter filter (startsWith): found ${filteredPairs.length} matches`);
    } else {
      // For longer filters, check if name/symbol includes the filter
      filteredPairs = newPairs.filter(
        (pair) =>
          pair.name.toLowerCase().includes(filterLower) ||
          pair.symbol.toLowerCase().includes(filterLower)
      );
      console.log(`[Sniper] Multi-char filter (includes): found ${filteredPairs.length} matches`);
    }
    
    // Log matching pairs
    if (filteredPairs.length > 0) {
      console.log(`[Sniper] Matching pairs:`, filteredPairs.slice(0, 5).map(p => `${p.symbol} (${p.name})`));
    }
  }

  if (filteredPairs.length === 0) {
    return {
      strategyId,
      strategyName,
      action: "NO_OPPORTUNITIES",
      details: config.nameFilter 
        ? `No pairs matching name filter "${config.nameFilter}"` 
        : "No new pairs matching criteria",
    };
  }

  // Find first pair we haven't bought yet
  const targetPair = filteredPairs.find((pair) => !boughtTokens.has(pair.address));

  if (!targetPair) {
    return {
      strategyId,
      strategyName,
      action: "ALREADY_BOUGHT",
      details: `Already bought all ${filteredPairs.length} matching pairs`,
    };
  }

  // Execute the trade
  const solAmount = config.amount || 0.01;
  const slippageBps = config.slippageBps || 300; // 3% default for memecoins
  const inputMint = TOKEN_MINTS.SOL;
  const outputMint = targetPair.address;

  try {
    // Get quote first
    const quote = await getSwapQuote(
      inputMint,
      outputMint,
      toSmallestUnit(solAmount, 9), // SOL has 9 decimals
      slippageBps
    );

    // Execute swap
    const result = await executeSwap(
      encryptedPrivateKey,
      inputMint,
      outputMint,
      toSmallestUnit(solAmount, 9),
      slippageBps
    );

    // Record trade in database
    await prisma.trade.create({
      data: {
        userId,
        signature: result.signature,
        type: "SPOT",
        direction: "BUY",
        inputToken: "SOL",
        outputToken: targetPair.address,
        inputAmount: solAmount,
        outputAmount: parseFloat(result.outputAmount) / Math.pow(10, 9), // Approximate
        priceUsd: targetPair.price,
        status: "CONFIRMED",
      },
    });

    return {
      strategyId,
      strategyName,
      action: "TRADE_EXECUTED",
      details: `Bought ${targetPair.symbol} (${targetPair.name})`,
      trade: {
        signature: result.signature,
        tokenAddress: targetPair.address,
        tokenSymbol: targetPair.symbol,
        inputAmount: solAmount,
        outputAmount: fromSmallestUnit(parseInt(result.outputAmount), 9),
      },
    };
  } catch (error) {
    console.error("Sniper trade error:", error);
    return {
      strategyId,
      strategyName,
      action: "ERROR",
      error: error instanceof Error ? error.message : "Trade execution failed",
    };
  }
}

/**
 * Execute a conditional strategy - buy/sell when indicator conditions are met
 */
async function executeConditionalStrategy(
  strategyId: string,
  strategyName: string,
  config: StrategyConfig,
  encryptedPrivateKey: string,
  userId: string
): Promise<ExecutionResult> {
  if (!config.condition || !config.inputToken) {
    return {
      strategyId,
      strategyName,
      action: "ERROR",
      error: "Missing condition or inputToken in config",
    };
  }

  const { indicator, period, timeframe, trigger, value } = config.condition;
  const tokenAddress = TOKEN_MINTS[config.inputToken.toUpperCase() as keyof typeof TOKEN_MINTS] || config.inputToken;

  try {
    // Get current price data
    const ohlcv = await getOHLCV(tokenAddress, (timeframe || "1H") as any, 100);
    
    if (ohlcv.length < (period || 20)) {
      return {
        strategyId,
        strategyName,
        action: "NO_OPPORTUNITIES",
        details: "Not enough price data for indicator calculation",
      };
    }

    const closePrices = ohlcv.map((c) => c.close);
    const currentPrice = closePrices[closePrices.length - 1];
    let indicatorValue: number;
    let conditionMet = false;

    // Calculate indicator value
    if (indicator === "EMA") {
      const emaValues = calculateEMA(closePrices, period || 20);
      indicatorValue = emaValues[emaValues.length - 1];
    } else if (indicator === "RSI") {
      const rsiValues = calculateRSI(closePrices, period || 14);
      indicatorValue = rsiValues[rsiValues.length - 1];
    } else if (indicator === "PRICE") {
      indicatorValue = value || 0;
    } else {
      // SMA fallback
      const sum = closePrices.slice(-(period || 20)).reduce((a, b) => a + b, 0);
      indicatorValue = sum / (period || 20);
    }

    // Check trigger conditions
    // For RSI, triggers compare the RSI value itself (0-100) not price
    if (indicator === "RSI") {
      // RSI-specific triggers - compare RSI value to thresholds
      const rsiValue = indicatorValue;
      const threshold = value || 30; // Default oversold threshold
      
      switch (trigger) {
        case "price_above": // RSI above threshold (overbought)
          conditionMet = rsiValue > threshold;
          break;
        case "price_below": // RSI below threshold (oversold)
          conditionMet = rsiValue < threshold;
          break;
        case "price_touches": // RSI near threshold
          conditionMet = Math.abs(rsiValue - threshold) < 2;
          break;
        case "crosses_above": // RSI crosses above threshold
          if (closePrices.length >= 2) {
            const prevRsi = calculateRSI(closePrices.slice(0, -1), period || 14);
            const prevRsiValue = prevRsi[prevRsi.length - 1];
            conditionMet = rsiValue > threshold && prevRsiValue <= threshold;
          }
          break;
        case "crosses_below": // RSI crosses below threshold
          if (closePrices.length >= 2) {
            const prevRsi = calculateRSI(closePrices.slice(0, -1), period || 14);
            const prevRsiValue = prevRsi[prevRsi.length - 1];
            conditionMet = rsiValue < threshold && prevRsiValue >= threshold;
          }
          break;
      }
    } else {
      // For EMA/SMA/PRICE, compare price to indicator value
      switch (trigger) {
        case "price_above":
          conditionMet = currentPrice > indicatorValue;
          break;
        case "price_below":
          conditionMet = currentPrice < indicatorValue;
          break;
        case "price_touches":
          // Within 0.5% of indicator value
          conditionMet = Math.abs(currentPrice - indicatorValue) / indicatorValue < 0.005;
          break;
        case "crosses_above":
          // Current price above, previous below
          if (closePrices.length >= 2) {
            const prevPrice = closePrices[closePrices.length - 2];
            conditionMet = currentPrice > indicatorValue && prevPrice <= indicatorValue;
          }
          break;
        case "crosses_below":
          if (closePrices.length >= 2) {
            const prevPrice = closePrices[closePrices.length - 2];
            conditionMet = currentPrice < indicatorValue && prevPrice >= indicatorValue;
          }
          break;
      }
    }

    if (!conditionMet) {
      return {
        strategyId,
        strategyName,
        action: "NO_OPPORTUNITIES",
        details: `Waiting for condition: ${trigger} ${indicator}${period ? `(${period})` : ""} = ${indicatorValue.toFixed(4)}, current price = ${currentPrice.toFixed(4)}`,
      };
    }

    // Condition met - execute trade
    const solAmount = config.amount || 0.1;
    const slippageBps = config.slippageBps || 100;
    const direction = config.direction || "buy";

    let inputMint: string;
    let outputMint: string;
    let inputDecimals: number;

    if (direction === "buy") {
      inputMint = TOKEN_MINTS.SOL;
      outputMint = tokenAddress;
      inputDecimals = 9; // SOL always has 9 decimals
    } else {
      inputMint = tokenAddress;
      outputMint = TOKEN_MINTS.SOL;
      // For selling, we need to determine the token's decimals
      // Common tokens: USDC/USDT have 6, most SPL tokens have 9
      // Check known tokens first
      if (inputMint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" || 
          inputMint === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB") {
        inputDecimals = 6; // USDC/USDT
      } else if (inputMint === "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263") {
        inputDecimals = 5; // BONK
      } else {
        inputDecimals = 9; // Default for most SPL tokens
      }
    }

    const result = await executeSwap(
      encryptedPrivateKey,
      inputMint,
      outputMint,
      toSmallestUnit(solAmount, inputDecimals),
      slippageBps
    );

    // Record trade
    await prisma.trade.create({
      data: {
        userId,
        signature: result.signature,
        type: "SPOT",
        direction: direction.toUpperCase(),
        inputToken: config.inputToken,
        outputToken: config.outputToken || "SOL",
        inputAmount: solAmount,
        outputAmount: fromSmallestUnit(parseInt(result.outputAmount), 9),
        priceUsd: currentPrice,
        status: "CONFIRMED",
      },
    });

    // Deactivate strategy after execution (one-time trigger)
    await prisma.strategy.update({
      where: { id: strategyId },
      data: { isActive: false },
    });

    return {
      strategyId,
      strategyName,
      action: "TRADE_EXECUTED",
      details: `${direction.toUpperCase()} executed: ${indicator}${period ? `(${period})` : ""} condition met at ${currentPrice.toFixed(4)}`,
      trade: {
        signature: result.signature,
        tokenAddress,
        tokenSymbol: config.inputToken,
        inputAmount: solAmount,
        outputAmount: fromSmallestUnit(parseInt(result.outputAmount), 9),
      },
    };
  } catch (error) {
    console.error("Conditional strategy error:", error);
    return {
      strategyId,
      strategyName,
      action: "ERROR",
      error: error instanceof Error ? error.message : "Strategy execution failed",
    };
  }
}

/**
 * Get strategy execution status summary
 */
export async function getStrategyStatus(userId: string): Promise<{
  activeCount: number;
  totalTradesToday: number;
  strategies: Array<{
    id: string;
    name: string;
    isActive: boolean;
    type: string;
    tradesToday: number;
  }>;
}> {
  const strategies = await prisma.strategy.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tradesToday = await prisma.trade.groupBy({
    by: ["outputToken"],
    where: {
      userId,
      createdAt: { gte: todayStart },
      status: "CONFIRMED",
    },
    _count: true,
  });

  const totalTradesToday = tradesToday.reduce((sum, t) => sum + t._count, 0);

  return {
    activeCount: strategies.filter((s) => s.isActive).length,
    totalTradesToday,
    strategies: strategies.map((s) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive,
      type: (s.config as unknown as StrategyConfig).type || "UNKNOWN",
      tradesToday: 0, // Would need per-strategy trade tracking
    })),
  };
}
