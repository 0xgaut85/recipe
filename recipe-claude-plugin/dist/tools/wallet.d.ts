/**
 * Wallet MCP Tools
 * Generate wallets, check balances, export keys
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const walletTools: Tool[];
export declare function handleWalletTool(name: string, args: Record<string, unknown> | undefined): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=wallet.d.ts.map