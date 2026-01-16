const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API_URL = `https://api.helius.xyz/v0`;

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  tokenAccount: string;
}

export interface EnhancedTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  fee: number;
  feePayer: string;
  type: string;
  source: string;
  description: string;
  accountData: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
      tokenAccount: string;
      userAccount: string;
    }>;
  }>;
}

export interface TokenMetadata {
  mint: string;
  onChainData: {
    name: string;
    symbol: string;
    uri: string;
  };
  offChainData: {
    name: string;
    symbol: string;
    description: string;
    image: string;
  };
}

/**
 * Get token balances for a wallet
 */
export async function getTokenBalances(
  walletAddress: string
): Promise<TokenBalance[]> {
  if (!HELIUS_API_KEY) {
    console.warn("Helius API key not configured");
    return [];
  }

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-balances",
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { encoding: "jsonParsed" },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius RPC error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return (data.result?.value || []).map((account: {
      pubkey: string;
      account: {
        data: {
          parsed: {
            info: {
              mint: string;
              tokenAmount: {
                uiAmount: number;
                decimals: number;
              };
            };
          };
        };
      };
    }) => ({
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
      tokenAccount: account.pubkey,
    }));
  } catch (error) {
    console.error("Helius balances error:", error);
    return [];
  }
}

/**
 * Get SOL balance for a wallet
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  if (!HELIUS_API_KEY) {
    console.warn("Helius API key not configured");
    return 0;
  }

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-sol",
        method: "getBalance",
        params: [walletAddress],
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius RPC error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    // Convert lamports to SOL
    return (data.result?.value || 0) / 1e9;
  } catch (error) {
    console.error("Helius SOL balance error:", error);
    return 0;
  }
}

/**
 * Get parsed transaction history
 */
export async function getTransactionHistory(
  walletAddress: string,
  limit = 20
): Promise<EnhancedTransaction[]> {
  if (!HELIUS_API_KEY) {
    console.warn("Helius API key not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${HELIUS_API_URL}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Helius transactions error:", error);
    return [];
  }
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(
  mintAddresses: string[]
): Promise<TokenMetadata[]> {
  if (!HELIUS_API_KEY) {
    console.warn("Helius API key not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${HELIUS_API_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mintAccounts: mintAddresses }),
      }
    );

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Helius metadata error:", error);
    return [];
  }
}

/**
 * Analyze wallet activity patterns
 */
export async function analyzeWalletActivity(walletAddress: string) {
  const [transactions, balances, solBalance] = await Promise.all([
    getTransactionHistory(walletAddress, 50),
    getTokenBalances(walletAddress),
    getSolBalance(walletAddress),
  ]);

  // Analyze transaction patterns
  const swaps = transactions.filter((tx) => 
    tx.type === "SWAP" || tx.source === "JUPITER" || tx.source === "RAYDIUM"
  );
  
  const transfers = transactions.filter((tx) => tx.type === "TRANSFER");
  
  // Calculate activity metrics
  const now = Date.now() / 1000;
  const recentTxs = transactions.filter((tx) => now - tx.timestamp < 86400);
  
  return {
    wallet: walletAddress,
    solBalance,
    tokenCount: balances.length,
    totalTransactions: transactions.length,
    swapCount: swaps.length,
    transferCount: transfers.length,
    last24hActivity: recentTxs.length,
    mostActiveSource: getMostFrequent(transactions.map((tx) => tx.source)),
    balances: balances.filter((b) => b.amount > 0),
  };
}

function getMostFrequent(arr: string[]): string {
  const counts: Record<string, number> = {};
  arr.forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostFrequent = "";
  
  for (const [key, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = key;
    }
  }
  
  return mostFrequent;
}

/**
 * Watch for new transactions (webhook setup helper)
 */
export function getWebhookConfig(walletAddress: string) {
  return {
    webhookURL: "YOUR_WEBHOOK_URL",
    transactionTypes: ["SWAP", "TRANSFER"],
    accountAddresses: [walletAddress],
    webhookType: "enhanced",
  };
}
