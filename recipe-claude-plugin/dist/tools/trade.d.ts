/**
 * Trade MCP Tools
 * Get quotes and execute swaps - matches main app's trading functionality
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const tradeTools: Tool[];
export declare function handleTradeTool(name: string, args: Record<string, unknown> | undefined): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=trade.d.ts.map