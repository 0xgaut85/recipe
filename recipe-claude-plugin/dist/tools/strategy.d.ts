/**
 * Strategy MCP Tools
 * Create and manage trading strategies - matches main app's claude-tools.ts
 * Supports SNIPER, SPOT, and CONDITIONAL strategy types
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const strategyTools: Tool[];
export declare function handleStrategyTool(name: string, args: Record<string, unknown> | undefined): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=strategy.d.ts.map