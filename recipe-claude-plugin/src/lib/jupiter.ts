/**
 * Jupiter API Integration
 * Direct Jupiter calls for swaps - no API key needed
 * Uses Jupiter Swap API v1 (same as main app)
 */

import { Connection, VersionedTransaction } from "@solana/web3.js";
import { getKeypair, getConnection } from "./wallet.js";

// Jupiter Swap API v1 - matches main app
const JUPITER_API = "https://api.jup.ag/swap/v1";

// Common token mints - matches main app's src/lib/jupiter.ts
export const TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  WSOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  POPCAT: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
  WEN: "WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  // Added from main app
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  ORCA: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  MANGO: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
  SAMO: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  RENDER: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
  JITO: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
};

// Token decimals - matches main app
const TOKEN_DECIMALS: Record<string, number> = {
  [TOKEN_MINTS.SOL]: 9,
  [TOKEN_MINTS.USDC]: 6,
  [TOKEN_MINTS.USDT]: 6,
  [TOKEN_MINTS.BONK]: 5,
  [TOKEN_MINTS.WIF]: 6,
  [TOKEN_MINTS.JUP]: 6,
  [TOKEN_MINTS.RAY]: 6,
  [TOKEN_MINTS.ORCA]: 6,
  [TOKEN_MINTS.MANGO]: 6,
  [TOKEN_MINTS.SAMO]: 9,
  [TOKEN_MINTS.RENDER]: 8,
  [TOKEN_MINTS.JITO]: 9,
  [TOKEN_MINTS.PYTH]: 6,
  [TOKEN_MINTS.POPCAT]: 9,
  [TOKEN_MINTS.WEN]: 5,
};

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
    };
    percent: number;
  }>;
}

/**
 * Check if a string is a valid Solana address (base58, 32-44 chars)
 */
export function isSolanaAddress(str: string): boolean {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(str);
}

/**
 * Resolve token symbol to mint address (simple, no search)
 */
export function resolveToken(input: string): string {
  const upper = input.toUpperCase();
  return TOKEN_MINTS[upper] || input;
}

/**
 * Get token decimals
 */
export function getTokenDecimals(mint: string): number {
  return TOKEN_DECIMALS[mint] || 9;
}

/**
 * Convert amount to smallest unit
 */
export function toSmallestUnit(amount: number, decimals: number): number {
  return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Convert from smallest unit
 */
export function fromSmallestUnit(amount: number, decimals: number): number {
  return amount / Math.pow(10, decimals);
}

/**
 * Get swap quote from Jupiter
 */
export async function getQuote(
  inputToken: string,
  outputToken: string,
  amount: number,
  slippageBps: number = 50
): Promise<{
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  route: string;
  exchangeRate: number;
  rawQuote: QuoteResponse;
}> {
  const inputMint = resolveToken(inputToken);
  const outputMint = resolveToken(outputToken);
  const inputDecimals = getTokenDecimals(inputMint);
  const outputDecimals = getTokenDecimals(outputMint);
  const amountSmallest = toSmallestUnit(amount, inputDecimals);

  const url = new URL(`${JUPITER_API}/quote`);
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amountSmallest.toString());
  url.searchParams.set("slippageBps", slippageBps.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter quote error: ${error}`);
  }

  const quote = await response.json() as QuoteResponse;

  const inputAmount = fromSmallestUnit(parseInt(quote.inAmount), inputDecimals);
  const outputAmount = fromSmallestUnit(parseInt(quote.outAmount), outputDecimals);

  return {
    inputAmount,
    outputAmount,
    priceImpact: parseFloat(quote.priceImpactPct),
    route: quote.routePlan.map((r) => r.swapInfo.label).join(" → "),
    exchangeRate: outputAmount / inputAmount,
    rawQuote: quote,
  };
}

/**
 * Execute a swap using local wallet
 */
export async function executeSwap(
  inputToken: string,
  outputToken: string,
  amount: number,
  slippageBps: number = 50
): Promise<{
  success: boolean;
  signature: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  explorerUrl: string;
}> {
  const keypair = getKeypair();
  if (!keypair) {
    throw new Error("No wallet found. Use claude_trade_wallet_create first.");
  }

  const inputMint = resolveToken(inputToken);
  const outputMint = resolveToken(outputToken);
  const inputDecimals = getTokenDecimals(inputMint);
  const outputDecimals = getTokenDecimals(outputMint);
  const amountSmallest = toSmallestUnit(amount, inputDecimals);

  // Get quote
  const quoteUrl = new URL(`${JUPITER_API}/quote`);
  quoteUrl.searchParams.set("inputMint", inputMint);
  quoteUrl.searchParams.set("outputMint", outputMint);
  quoteUrl.searchParams.set("amount", amountSmallest.toString());
  quoteUrl.searchParams.set("slippageBps", slippageBps.toString());

  const quoteResponse = await fetch(quoteUrl.toString());
  if (!quoteResponse.ok) {
    throw new Error(`Jupiter quote error: ${quoteResponse.status}`);
  }
  const quote = await quoteResponse.json() as QuoteResponse;

  // Get swap transaction
  const swapResponse = await fetch(`${JUPITER_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!swapResponse.ok) {
    const error = await swapResponse.text();
    throw new Error(`Jupiter swap error: ${error}`);
  }

  const swapResult = await swapResponse.json() as { swapTransaction: string };
  const { swapTransaction } = swapResult;

  // Deserialize and sign
  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  transaction.sign([keypair]);

  // Send transaction
  const connection = getConnection();
  
  // Get blockhash before sending
  const latestBlockhash = await connection.getLatestBlockhash();
  
  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Confirm using polling (avoids WebSocket issues) - matches main app
  await confirmTransactionPolling(connection, signature, latestBlockhash);

  const inputAmount = fromSmallestUnit(parseInt(quote.inAmount), inputDecimals);
  const outputAmount = fromSmallestUnit(parseInt(quote.outAmount), outputDecimals);

  return {
    success: true,
    signature,
    inputAmount,
    outputAmount,
    priceImpact: parseFloat(quote.priceImpactPct),
    explorerUrl: `https://solscan.io/tx/${signature}`,
  };
}

/**
 * Confirm transaction using polling instead of WebSocket subscription
 * This avoids WebSocket issues and matches the main app's implementation
 */
async function confirmTransactionPolling(
  connection: Connection,
  signature: string,
  blockhash: { blockhash: string; lastValidBlockHeight: number },
  maxRetries: number = 30,
  retryDelayMs: number = 1000
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    const status = await connection.getSignatureStatus(signature);
    
    if (status?.value?.confirmationStatus === "confirmed" || 
        status?.value?.confirmationStatus === "finalized") {
      if (status.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
      }
      return; // Transaction confirmed successfully
    }

    // Check if blockhash expired
    const currentBlockHeight = await connection.getBlockHeight();
    if (currentBlockHeight > blockhash.lastValidBlockHeight) {
      throw new Error("Transaction expired: blockhash no longer valid");
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
  }

  throw new Error(`Transaction confirmation timeout after ${maxRetries} attempts`);
}

/**
 * Get token price in USD (via USDC quote)
 */
export async function getTokenPrice(token: string): Promise<number> {
  const tokenMint = resolveToken(token);
  const tokenDecimals = getTokenDecimals(tokenMint);
  const oneToken = Math.pow(10, tokenDecimals);

  try {
    const url = new URL(`${JUPITER_API}/quote`);
    url.searchParams.set("inputMint", tokenMint);
    url.searchParams.set("outputMint", TOKEN_MINTS.USDC);
    url.searchParams.set("amount", oneToken.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      return 0;
    }

    const quote = await response.json() as QuoteResponse;
    return parseInt(quote.outAmount) / 1e6; // USDC has 6 decimals
  } catch {
    return 0;
  }
}

/**
 * List available token symbols
 */
export function listTokens(): Array<{ symbol: string; address: string }> {
  return Object.entries(TOKEN_MINTS).map(([symbol, address]) => ({
    symbol,
    address,
  }));
}

/**
 * Resolve token to mint address with search fallback
 * Matches main app's resolveTokenMintWithSearch function
 * Use this for trading to handle any token name/symbol
 */
export async function resolveTokenMintWithSearch(token: string): Promise<{
  address: string;
  symbol: string;
  decimals: number;
} | null> {
  // Import dynamically to avoid circular dependency
  const { searchTokens, getTokenOverview } = await import("./api.js");

  const upperToken = token.toUpperCase();

  // Check known tokens first
  if (upperToken in TOKEN_MINTS) {
    const address = TOKEN_MINTS[upperToken];
    const decimals = getTokenDecimals(address);
    return { address, symbol: upperToken, decimals };
  }

  // If it's already a valid Solana address, use it directly
  if (isSolanaAddress(token)) {
    try {
      const overview = await getTokenOverview(token);
      if (overview) {
        return {
          address: token,
          symbol: overview.symbol,
          decimals: overview.decimals,
        };
      }
    } catch {
      // Continue with the address anyway
    }
    const decimals = getTokenDecimals(token);
    return { address: token, symbol: "???", decimals };
  }

  // Search for the token by name/symbol
  try {
    const results = await searchTokens(token);
    if (results.length > 0) {
      // Find exact match first, then best match
      const exactMatch = results.find(
        (r) =>
          r.symbol.toUpperCase() === upperToken ||
          r.name.toUpperCase() === upperToken
      );
      const bestMatch = exactMatch || results[0];
      return {
        address: bestMatch.address,
        symbol: bestMatch.symbol,
        decimals: 9, // Default, will be handled by Jupiter
      };
    }
  } catch (error) {
    console.error("Token search error:", error);
  }

  return null;
}
