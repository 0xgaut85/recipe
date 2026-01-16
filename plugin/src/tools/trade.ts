/**
 * Trading Tools for Plugin
 * Execute real trades using the local wallet
 */

import { z } from "zod";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getKeypair, loadWallet } from "../lib/local-wallet";

const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";

// Common token mints
const TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
};

function resolveTokenMint(token: string): string {
  const upper = token.toUpperCase();
  return TOKEN_MINTS[upper] || token;
}

function getTokenDecimals(mint: string): number {
  if (
    mint === TOKEN_MINTS.USDC ||
    mint === TOKEN_MINTS.USDT
  ) {
    return 6;
  }
  return 9;
}

function toSmallestUnit(amount: number, decimals: number): number {
  return Math.floor(amount * Math.pow(10, decimals));
}

function fromSmallestUnit(amount: number, decimals: number): number {
  return amount / Math.pow(10, decimals);
}

// Schemas
const quoteSchema = z.object({
  inputToken: z.string().describe("Input token (symbol or mint address)"),
  outputToken: z.string().describe("Output token (symbol or mint address)"),
  amount: z.number().describe("Amount of input token"),
  slippageBps: z.number().optional().default(50),
});

const swapSchema = z.object({
  inputToken: z.string().describe("Input token (symbol or mint address)"),
  outputToken: z.string().describe("Output token (symbol or mint address)"),
  amount: z.number().describe("Amount of input token"),
  slippageBps: z.number().optional().default(50),
});

const balanceSchema = z.object({});

export const tradeTools = [
  {
    definition: {
      name: "get_swap_quote",
      description: "Get a quote for swapping tokens via Jupiter",
      input_schema: {
        type: "object" as const,
        properties: {
          inputToken: { type: "string", description: "Input token (SOL, USDC, or mint address)" },
          outputToken: { type: "string", description: "Output token (symbol or mint address)" },
          amount: { type: "number", description: "Amount of input token to swap" },
          slippageBps: { type: "number", description: "Slippage in basis points (default: 50)" },
        },
        required: ["inputToken", "outputToken", "amount"],
      },
    },
    handler: async (args: z.infer<typeof quoteSchema>) => {
      const inputMint = resolveTokenMint(args.inputToken);
      const outputMint = resolveTokenMint(args.outputToken);
      const inputDecimals = getTokenDecimals(inputMint);
      const amountSmallest = toSmallestUnit(args.amount, inputDecimals);

      const url = new URL(`${JUPITER_API_BASE}/quote`);
      url.searchParams.set("inputMint", inputMint);
      url.searchParams.set("outputMint", outputMint);
      url.searchParams.set("amount", amountSmallest.toString());
      url.searchParams.set("slippageBps", (args.slippageBps || 50).toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }

      const quote = await response.json();
      const outputDecimals = getTokenDecimals(outputMint);

      return {
        inputAmount: args.amount,
        outputAmount: fromSmallestUnit(parseInt(quote.outAmount), outputDecimals),
        priceImpact: quote.priceImpactPct,
        route: quote.routePlan?.map((r: any) => r.swapInfo.label).join(" -> "),
      };
    },
  },
  {
    definition: {
      name: "execute_swap",
      description:
        "Execute a token swap via Jupiter using your local wallet. WARNING: This uses real funds!",
      input_schema: {
        type: "object" as const,
        properties: {
          inputToken: { type: "string", description: "Input token (SOL, USDC, or mint address)" },
          outputToken: { type: "string", description: "Output token (symbol or mint address)" },
          amount: { type: "number", description: "Amount of input token to swap" },
          slippageBps: { type: "number", description: "Slippage in basis points (default: 50)" },
        },
        required: ["inputToken", "outputToken", "amount"],
      },
    },
    handler: async (args: z.infer<typeof swapSchema>) => {
      const keypair = getKeypair();
      if (!keypair) {
        return { error: "No wallet found. Please run the plugin first to generate a wallet." };
      }

      const inputMint = resolveTokenMint(args.inputToken);
      const outputMint = resolveTokenMint(args.outputToken);
      const inputDecimals = getTokenDecimals(inputMint);
      const amountSmallest = toSmallestUnit(args.amount, inputDecimals);

      // Get quote
      const quoteUrl = new URL(`${JUPITER_API_BASE}/quote`);
      quoteUrl.searchParams.set("inputMint", inputMint);
      quoteUrl.searchParams.set("outputMint", outputMint);
      quoteUrl.searchParams.set("amount", amountSmallest.toString());
      quoteUrl.searchParams.set("slippageBps", (args.slippageBps || 50).toString());

      const quoteResponse = await fetch(quoteUrl.toString());
      if (!quoteResponse.ok) {
        throw new Error(`Jupiter quote error: ${quoteResponse.status}`);
      }
      const quote = await quoteResponse.json();

      // Get swap transaction
      const swapResponse = await fetch(`${JUPITER_API_BASE}/swap`, {
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
        throw new Error(`Jupiter swap error: ${swapResponse.status}`);
      }

      const { swapTransaction } = await swapResponse.json();

      // Deserialize and sign
      const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      transaction.sign([keypair]);

      // Send transaction
      const connection = new Connection(RPC_URL, "confirmed");
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

      const outputDecimals = getTokenDecimals(outputMint);

      return {
        success: true,
        signature,
        inputAmount: args.amount,
        outputAmount: fromSmallestUnit(parseInt(quote.outAmount), outputDecimals),
        priceImpact: quote.priceImpactPct,
        explorerUrl: `https://solscan.io/tx/${signature}`,
      };
    },
  },
  {
    definition: {
      name: "get_wallet_balance",
      description: "Get your local wallet's SOL and token balances",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    handler: async () => {
      const wallet = loadWallet();
      if (!wallet) {
        return { error: "No wallet found. Please run the plugin first to generate a wallet." };
      }

      const connection = new Connection(RPC_URL, "confirmed");
      const publicKey = new PublicKey(wallet.publicKey);

      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey);

      // Get token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      });

      const tokens = tokenAccounts.value.map((account) => {
        const parsed = account.account.data.parsed.info;
        return {
          mint: parsed.mint,
          balance: parsed.tokenAmount.uiAmount || 0,
          decimals: parsed.tokenAmount.decimals,
        };
      });

      return {
        publicKey: wallet.publicKey,
        solBalance: solBalance / 1_000_000_000,
        tokens,
      };
    },
  },
];
