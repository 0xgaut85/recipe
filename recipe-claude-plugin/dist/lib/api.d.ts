/**
 * Recipe.money API Client
 * All data requiring API keys goes through our backend - users need no configuration
 */
export interface TrendingToken {
    symbol: string;
    name: string;
    address: string;
    logoURI?: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    rank?: number;
}
export interface NewLaunch {
    mint: string;
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
    price: number;
    liquidity: number;
    marketCap: number;
    volume24h: number;
    listedAt?: number;
    ageMinutes?: number;
    dex?: string;
}
export interface TokenBalance {
    token: string;
    symbol: string;
    name: string;
    balance: number;
    usdValue: number;
    decimals: number;
}
export interface TrendingData {
    hotTokens: TrendingToken[];
    volumeTokens: TrendingToken[];
    newLaunches: NewLaunch[];
    trendingPairs?: TrendingToken[];
    timestamp: string;
}
export interface WalletData {
    balances: TokenBalance[];
    address: string;
    timestamp: number;
}
export type TimeFrame = "1m" | "5m" | "15m" | "1H" | "4H" | "1D";
export interface OHLCVCandle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface TokenOverview {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    holder?: number;
}
export interface NewPairData {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
    price: number;
    liquidity: number;
    volume24h: number;
    marketCap: number;
    listedAt?: number;
    ageMinutes: number;
    dex?: string;
}
export interface PairOverview {
    price: number;
    volume30m: number;
    volume1h: number;
    volume24h: number;
    liquidity: number;
    trades30m: number;
    trades1h: number;
    priceChange30m: number;
    priceChange1h: number;
}
/**
 * Get trending tokens, volume leaders, and new launches
 * Uses Birdeye data via recipe.money backend
 */
export declare function getTrending(): Promise<TrendingData>;
/**
 * Get wallet balances for any address
 * Uses Helius data via recipe.money backend
 */
export declare function getWalletBalances(address: string): Promise<WalletData>;
/**
 * Search tokens by name or symbol via DexScreener (no API key needed)
 * Matches main app's src/lib/dexscreener.ts searchPairs function
 */
export declare function searchTokens(query: string): Promise<Array<{
    symbol: string;
    name: string;
    address: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    dex: string;
    url: string;
}>>;
/**
 * Get token info by address via DexScreener
 * Matches main app's src/lib/dexscreener.ts getPairsByToken function
 */
export declare function getTokenInfo(address: string): Promise<{
    symbol: string;
    name: string;
    address: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    dex: string;
    url: string;
} | null>;
/**
 * Get new pump.fun launches
 * Matches main app's src/lib/pumpfun.ts getNewLaunches function
 */
export declare function getNewLaunches(limit?: number): Promise<Array<{
    symbol: string;
    name: string;
    mint: string;
    description: string;
    marketCap: number;
    isComplete: boolean;
    creator: string;
    createdAt: string;
    twitter: string | null;
    telegram: string | null;
    website: string | null;
}>>;
/**
 * Get OHLCV candle data for technical analysis
 * NOTE: This feature requires Birdeye API key which is not available in the plugin.
 * The OHLCV endpoint is not implemented on recipe.money backend for public access.
 * Returns an error message directing users to use the web app for this feature.
 */
export declare function getOHLCV(tokenAddress: string, timeframe?: TimeFrame, limit?: number): Promise<OHLCVCandle[]>;
/**
 * Get new pairs with filters for sniping strategies
 * Uses trending data from recipe.money backend (which has Birdeye API key)
 * Applies local filtering for the options
 */
export declare function getNewPairs(options?: {
    maxAgeMinutes?: number;
    minLiquidity?: number;
    maxLiquidity?: number;
    minVolume?: number;
    minMarketCap?: number;
    maxMarketCap?: number;
    limit?: number;
}): Promise<NewPairData[]>;
/**
 * Get detailed pair metrics (volume, trades, price changes over multiple timeframes)
 * Uses DexScreener directly (no API key needed)
 * Note: 30m/1h granular data not available via DexScreener, only 24h
 */
export declare function getPairDetails(address: string): Promise<PairOverview | null>;
/**
 * Advanced token search with multiple filters
 * Uses DexScreener directly with local filtering (no API key needed)
 * Note: minHolders filter not available via DexScreener
 */
export declare function advancedSearchTokens(options: {
    keyword?: string;
    symbolStartsWith?: string;
    nameContains?: string;
    minMarketCap?: number;
    maxMarketCap?: number;
    minLiquidity?: number;
    maxLiquidity?: number;
    minVolume24h?: number;
    minHolders?: number;
    limit?: number;
}): Promise<TokenOverview[]>;
/**
 * Get token overview by address
 * Uses DexScreener directly (no API key needed)
 */
export declare function getTokenOverview(address: string): Promise<TokenOverview | null>;
//# sourceMappingURL=api.d.ts.map