const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
}

export interface EnhancedTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  description: string;
}

function getHeliusUrl(): string {
  if (!HELIUS_API_KEY) {
    throw new Error("HELIUS_API_KEY environment variable not set");
  }
  return `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
}

function getHeliusApiUrl(): string {
  if (!HELIUS_API_KEY) {
    throw new Error("HELIUS_API_KEY environment variable not set");
  }
  return `https://api.helius.xyz/v0`;
}

export async function getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  const response = await fetch(getHeliusUrl(), {
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
  }));
}

export async function getSolBalance(walletAddress: string): Promise<number> {
  const response = await fetch(getHeliusUrl(), {
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

  return (data.result?.value || 0) / 1e9;
}

export async function getTransactionHistory(
  walletAddress: string,
  limit = 20
): Promise<EnhancedTransaction[]> {
  const response = await fetch(
    `${getHeliusApiUrl()}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Helius API error: ${response.status}`);
  }

  return response.json();
}

export async function analyzeWallet(walletAddress: string) {
  const [transactions, balances, solBalance] = await Promise.all([
    getTransactionHistory(walletAddress, 50),
    getTokenBalances(walletAddress),
    getSolBalance(walletAddress),
  ]);

  const swaps = transactions.filter((tx) => 
    tx.type === "SWAP" || tx.source === "JUPITER" || tx.source === "RAYDIUM"
  );
  
  const now = Date.now() / 1000;
  const recentTxs = transactions.filter((tx) => now - tx.timestamp < 86400);
  
  return {
    wallet: walletAddress,
    solBalance,
    tokenCount: balances.filter((b) => b.amount > 0).length,
    totalTransactions: transactions.length,
    swapCount: swaps.length,
    last24hActivity: recentTxs.length,
    balances: balances.filter((b) => b.amount > 0),
  };
}
