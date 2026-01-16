/**
 * Jupiter API Integration
 * Direct Jupiter calls for swaps - no API key needed
 * Uses Jupiter Swap API v1 (same as main app)
 */
export declare const TOKEN_MINTS: Record<string, string>;
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
export declare function isSolanaAddress(str: string): boolean;
/**
 * Resolve token symbol to mint address (simple, no search)
 */
export declare function resolveToken(input: string): string;
/**
 * Get token decimals
 */
export declare function getTokenDecimals(mint: string): number;
/**
 * Convert amount to smallest unit
 */
export declare function toSmallestUnit(amount: number, decimals: number): number;
/**
 * Convert from smallest unit
 */
export declare function fromSmallestUnit(amount: number, decimals: number): number;
/**
 * Get swap quote from Jupiter
 */
export declare function getQuote(inputToken: string, outputToken: string, amount: number, slippageBps?: number): Promise<{
    inputAmount: number;
    outputAmount: number;
    priceImpact: number;
    route: string;
    exchangeRate: number;
    rawQuote: QuoteResponse;
}>;
/**
 * Execute a swap using local wallet
 */
export declare function executeSwap(inputToken: string, outputToken: string, amount: number, slippageBps?: number): Promise<{
    success: boolean;
    signature: string;
    inputAmount: number;
    outputAmount: number;
    priceImpact: number;
    explorerUrl: string;
}>;
/**
 * Get token price in USD (via USDC quote)
 */
export declare function getTokenPrice(token: string): Promise<number>;
/**
 * List available token symbols
 */
export declare function listTokens(): Array<{
    symbol: string;
    address: string;
}>;
/**
 * Resolve token to mint address with search fallback
 * Matches main app's resolveTokenMintWithSearch function
 * Use this for trading to handle any token name/symbol
 */
export declare function resolveTokenMintWithSearch(token: string): Promise<{
    address: string;
    symbol: string;
    decimals: number;
} | null>;
//# sourceMappingURL=jupiter.d.ts.map