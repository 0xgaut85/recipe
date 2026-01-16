/**
 * Jupiter API Integration
 * Direct Jupiter calls for swaps - no API key needed
 */

import { VersionedTransaction } from "@solana/web3.js";
import { getKeypair, getConnection } from "./wallet.js";

const JUPITER_API = "https://quote-api.jup.ag/v6";

// Common token mints
export const TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  POPCAT: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
  WEN: "WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
};

// Token decimals
const TOKEN_DECIMALS: Record<string, number> = {
  [TOKEN_MINTS.SOL]: 9,
  [TOKEN_MINTS.USDC]: 6,
  [TOKEN_MINTS.USDT]: 6,
  [TOKEN_MINTS.BONK]: 5,
  [TOKEN_MINTS.WIF]: 6,
  [TOKEN_MINTS.JUP]: 6,
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
 * Resolve token symbol to mint address
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
    throw new Error("No wallet found. Use recipe_wallet_create first.");
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
  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Confirm
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

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
