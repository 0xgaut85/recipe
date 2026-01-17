/**
 * Wallet MCP Tools
 * Generate wallets, check balances, export keys
 */
import { getOrCreateWallet, loadWallet, getSolBalance, getWalletPath, walletExists, } from "../lib/wallet.js";
import { getWalletBalances } from "../lib/api.js";
export const walletTools = [
    {
        name: "claude_trade_wallet_create",
        description: "Create a new Solana wallet or load existing one. Generates a keypair locally and saves to ~/.claude-trade/wallet.json. Returns public key and private key - user must fund this wallet with SOL to trade.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "claude_trade_wallet_info",
        description: "Get your wallet's public key, private key, and SOL balance. Shows the wallet stored at ~/.claude-trade/wallet.json.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "claude_trade_wallet_balance",
        description: "Get all token balances for a wallet. If no address provided, uses your local wallet.",
        inputSchema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    description: "Wallet address to check (optional - defaults to your wallet)",
                },
            },
        },
    },
    {
        name: "claude_trade_wallet_export",
        description: "Export wallet details for backup. Shows path to wallet file and all keys.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];
export async function handleWalletTool(name, args) {
    switch (name) {
        case "claude_trade_wallet_create": {
            const { wallet, isNew } = getOrCreateWallet();
            const balance = await getSolBalance(wallet.publicKey);
            const result = {
                status: isNew ? "NEW_WALLET_CREATED" : "WALLET_LOADED",
                publicKey: wallet.publicKey,
                privateKey: wallet.privateKey,
                solBalance: balance,
                createdAt: wallet.createdAt,
                storedAt: getWalletPath(),
                warning: "NEVER SHARE YOUR PRIVATE KEY. Anyone with it can steal your funds.",
                nextStep: balance === 0
                    ? "Fund your wallet by sending SOL to your public key address above."
                    : "Your wallet is funded and ready to trade!",
            };
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        case "claude_trade_wallet_info": {
            const wallet = loadWallet();
            if (!wallet) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "No wallet found",
                                solution: "Use claude_trade_wallet_create to generate a new wallet",
                            }, null, 2),
                        },
                    ],
                    isError: true,
                };
            }
            const balance = await getSolBalance(wallet.publicKey);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            publicKey: wallet.publicKey,
                            privateKey: wallet.privateKey,
                            solBalance: balance,
                            solBalanceFormatted: `${balance.toFixed(4)} SOL`,
                            createdAt: wallet.createdAt,
                            storedAt: getWalletPath(),
                        }, null, 2),
                    },
                ],
            };
        }
        case "claude_trade_wallet_balance": {
            let address = args?.address;
            if (!address) {
                const wallet = loadWallet();
                if (!wallet) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: "No wallet found and no address provided",
                                    solution: "Use claude_trade_wallet_create first or provide an address",
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
                address = wallet.publicKey;
            }
            try {
                const data = await getWalletBalances(address);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address: data.address,
                                balances: data.balances.map((b) => ({
                                    symbol: b.symbol,
                                    name: b.name,
                                    balance: b.balance,
                                    balanceFormatted: `${b.balance.toFixed(b.decimals > 4 ? 4 : b.decimals)} ${b.symbol}`,
                                })),
                                totalTokens: data.balances.length,
                            }, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                // Fallback to just SOL balance if API fails
                const solBalance = await getSolBalance(address);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address,
                                balances: [
                                    {
                                        symbol: "SOL",
                                        name: "Solana",
                                        balance: solBalance,
                                        balanceFormatted: `${solBalance.toFixed(4)} SOL`,
                                    },
                                ],
                                note: "Only SOL balance shown - token balance API unavailable",
                            }, null, 2),
                        },
                    ],
                };
            }
        }
        case "claude_trade_wallet_export": {
            if (!walletExists()) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "No wallet to export",
                                solution: "Use claude_trade_wallet_create to generate a wallet first",
                            }, null, 2),
                        },
                    ],
                    isError: true,
                };
            }
            const wallet = loadWallet();
            const balance = await getSolBalance(wallet.publicKey);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            exportData: {
                                publicKey: wallet.publicKey,
                                privateKey: wallet.privateKey,
                                createdAt: wallet.createdAt,
                            },
                            currentBalance: `${balance.toFixed(4)} SOL`,
                            filePath: getWalletPath(),
                            warning: "Store this backup securely. Never share your private key!",
                        }, null, 2),
                    },
                ],
            };
        }
        default:
            return {
                content: [{ type: "text", text: `Unknown wallet tool: ${name}` }],
                isError: true,
            };
    }
}
//# sourceMappingURL=wallet.js.map