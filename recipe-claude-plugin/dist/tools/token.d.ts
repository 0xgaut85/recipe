/**
 * Token MCP Tools
 * Search tokens, get info, trending, new launches, OHLCV, indicators
 * Matches main app's claude-tools.ts functionality
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const tokenTools: Tool[];
export declare function handleTokenTool(name: string, args: Record<string, unknown> | undefined): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=token.d.ts.map