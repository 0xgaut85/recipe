import {
  Connection,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import { getConnection, getKeypairFromEncrypted } from "./wallet";

const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";

// Common token mints with their decimals
export const TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  ORCA: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  MANGO: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
  WSOL: "So11111111111111111111111111111111111111112",
  SAMO: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  RENDER: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
  JITO: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
};

// Known token decimals (cache to avoid on-chain lookups)
const KNOWN_DECIMALS: Record<string, number> = {
  [TOKEN_MINTS.SOL]: 9,
  [TOKEN_MINTS.USDC]: 6,
  [TOKEN_MINTS.USDT]: 6,
  [TOKEN_MINTS.BONK]: 5,
  [TOKEN_MINTS.JUP]: 6,
  [TOKEN_MINTS.RAY]: 6,
};

// Cache for fetched decimals
const decimalsCache: Map<string, number> = new Map();

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

/**
 * Fetch token decimals from on-chain
 */
async function fetchTokenDecimals(mint: string): Promise<number> {
  // Check known decimals first
  if (KNOWN_DECIMALS[mint] !== undefined) {
    return KNOWN_DECIMALS[mint];
  }

  // Check cache
  const cached = decimalsCache.get(mint);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const connection = getConnection();
    const mintPubkey = new PublicKey(mint);
    const info = await connection.getParsedAccountInfo(mintPubkey);

    if (info.value && "parsed" in info.value.data) {
      const decimals = info.value.data.parsed.info.decimals;
      decimalsCache.set(mint, decimals);
      return decimals;
    }
  } catch (error) {
    console.error(`Failed to fetch decimals for ${mint}:`, error);
  }

  // Default to 9 if we can't determine
  return 9;
}

/**
 * Get a swap quote from Jupiter
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<SwapQuote> {
  const url = new URL(`${JUPITER_API_BASE}/quote`);
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amount.toString());
  url.searchParams.set("slippageBps", slippageBps.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter quote error: ${error}`);
  }

  return response.json();
}

/**
 * Get swap transaction from Jupiter
 */
export async function getSwapTransaction(
  quote: SwapQuote,
  userPublicKey: string,
  wrapUnwrapSOL: boolean = true
): Promise<string> {
  const response = await fetch(`${JUPITER_API_BASE}/swap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: wrapUnwrapSOL,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter swap error: ${error}`);
  }

  const { swapTransaction } = await response.json();
  return swapTransaction;
}

/**
 * Execute a swap using Jupiter
 */
export async function executeSwap(
  encryptedPrivateKey: string,
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<{
  signature: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
}> {
  const connection = getConnection();
  const keypair = getKeypairFromEncrypted(encryptedPrivateKey);

  // Get quote
  const quote = await getSwapQuote(inputMint, outputMint, amount, slippageBps);

  // Get swap transaction
  const swapTransactionBase64 = await getSwapTransaction(
    quote,
    keypair.publicKey.toBase58()
  );

  // Deserialize transaction
  const swapTransactionBuf = Buffer.from(swapTransactionBase64, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // Sign transaction
  transaction.sign([keypair]);

  // Send transaction
  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Confirm transaction
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return {
    signature,
    inputAmount: quote.inAmount,
    outputAmount: quote.outAmount,
    priceImpact: quote.priceImpactPct,
  };
}

/**
 * Get token price in USD using Jupiter
 * Fetches actual decimals for accurate pricing
 */
export async function getTokenPrice(tokenMint: string): Promise<number> {
  try {
    // Get actual decimals for the token
    const decimals = await fetchTokenDecimals(tokenMint);
    const oneToken = Math.pow(10, decimals);

    // Get quote for 1 token to USDC
    const quote = await getSwapQuote(
      tokenMint,
      TOKEN_MINTS.USDC,
      oneToken,
      100
    );

    // USDC has 6 decimals
    const usdcAmount = parseInt(quote.outAmount) / 1_000_000;
    return usdcAmount;
  } catch (error) {
    console.error("Failed to get token price:", error);
    return 0;
  }
}

/**
 * Convert SOL amount to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Get token decimals - fetches from chain if not known
 */
export async function getTokenDecimalsAsync(mint: string): Promise<number> {
  return fetchTokenDecimals(mint);
}

/**
 * Get token decimals (synchronous, uses known values or defaults)
 * For async accuracy, use getTokenDecimalsAsync
 */
export function getTokenDecimals(mint: string): number {
  // Check known decimals
  if (KNOWN_DECIMALS[mint] !== undefined) {
    return KNOWN_DECIMALS[mint];
  }

  // Check cache
  const cached = decimalsCache.get(mint);
  if (cached !== undefined) {
    return cached;
  }

  // Default to 9 (most common for SPL tokens)
  return 9;
}

/**
 * Convert amount to smallest unit based on decimals
 */
export function toSmallestUnit(amount: number, decimals: number): number {
  return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Convert from smallest unit to human readable
 */
export function fromSmallestUnit(amount: number, decimals: number): number {
  return amount / Math.pow(10, decimals);
}

/**
 * Preload decimals for a list of tokens
 * Call this to warm up the cache
 */
export async function preloadTokenDecimals(mints: string[]): Promise<void> {
  await Promise.all(mints.map((mint) => fetchTokenDecimals(mint)));
}
