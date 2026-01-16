const JUPITER_API = "https://quote-api.jup.ag/v6";

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

export const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
};

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps = 50
): Promise<QuoteResponse | null> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
  });

  const response = await fetch(`${JUPITER_API}/quote?${params}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter quote error: ${error}`);
  }

  return response.json();
}

export function formatQuote(
  quote: QuoteResponse,
  inputDecimals = 9,
  outputDecimals = 9
) {
  const inAmount = parseInt(quote.inAmount) / Math.pow(10, inputDecimals);
  const outAmount = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);
  const priceImpact = parseFloat(quote.priceImpactPct);

  return {
    inputAmount: inAmount,
    outputAmount: outAmount,
    priceImpact,
    slippage: quote.slippageBps / 100,
    route: quote.routePlan.map((r) => r.swapInfo.label).join(" → "),
    exchangeRate: outAmount / inAmount,
  };
}

export function resolveTokenSymbol(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  return TOKENS[upper as keyof typeof TOKENS] || null;
}
