# claude-trade

an experiment in giving llms financial agency.

## background

i've been thinking about what happens when you give an ai model actual tools to interact with markets - not just analysis, but execution. most trading bots are glorified if-statements. what if you could describe a strategy in plain english and have something that actually reasons about it?

this is an mcp plugin that connects claude to solana's defi infrastructure. it can check prices, analyze tokens, execute swaps, and run strategies autonomously. i wanted to see how far you could push the "ai agent" concept when there's real money on the line.

## what it actually does

gives claude a set of tools:
- wallet management (generates keypairs locally, checks balances)
- market data (prices, volume, liquidity, new launches via dexscreener/birdeye/pump.fun)
- trading (swaps through jupiter aggregator)
- strategy primitives (entry/exit conditions, position sizing, stop losses)

you describe what you want, claude figures out how to do it. the interesting part is watching it reason through edge cases you didn't think about.

## some things i've tried

telling it to "buy tokens that are trending but haven't pumped yet" - it built filters around volume/price divergence that were surprisingly sensible

asking it to "watch this wallet and do what they do" - copy trading with natural language config

"find new launches that look legit, not like rugs" - it developed heuristics around holder distribution, liquidity patterns, social links

none of this is magic. it's just an llm with tools. but the emergent behavior when you let it iterate on strategies is genuinely interesting.

## setup

```
/plugin marketplace install claude-trade
```

or manual:
```json
{
  "mcpServers": {
    "claude-trade": {
      "command": "node", 
      "args": ["path/to/dist/index.js"]
    }
  }
}
```

## architecture

- mcp server exposing tools to claude
- local wallet storage (keys never leave your machine)
- api layer talking to jupiter, dexscreener, birdeye, pump.fun
- no backend dependency for core functionality

## notes

this started as a weekend project to learn mcp. turned into something i actually use. sharing because i think more people should experiment with giving llms real-world agency - financial markets are a good testbed because feedback is immediate and unambiguous.

not financial advice. you will probably lose money. but you might learn something interesting about how these models reason under uncertainty.

## links

site: [claudetrade.io](https://claudetrade.io)  
twitter: [@claudetrade](https://x.com/claudetrade)
