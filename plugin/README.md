# recipe mcp server

a claude code plugin for solana vibetrading. get token data, analyze wallets, and create trading strategies directly in claude code.

## installation

### option 1: npx (recommended)

add to your claude code config (`~/.claude/claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "recipe": {
      "command": "npx",
      "args": ["-y", "recipe-mcp-server"],
      "env": {
        "HELIUS_API_KEY": "your-helius-api-key"
      }
    }
  }
}
```

### option 2: local installation

1. clone the repo and navigate to the plugin folder:

```bash
cd plugin
npm install
npm run build
```

2. add to your claude code config:

```json
{
  "mcpServers": {
    "recipe": {
      "command": "node",
      "args": ["/path/to/plugin/dist/index.js"],
      "env": {
        "HELIUS_API_KEY": "your-helius-api-key"
      }
    }
  }
}
```

## environment variables

| variable | required | description |
|----------|----------|-------------|
| `HELIUS_API_KEY` | yes | helius api key for wallet analysis and rpc calls. get one at [helius.dev](https://helius.dev) |

## available tools

### token tools

- **recipe_token_search** - search for tokens by name or symbol
- **recipe_token_info** - get detailed info for a token address
- **recipe_token_new_launches** - get latest pump.fun launches
- **recipe_token_pumpfun** - get pump.fun specific token data

### wallet tools

- **recipe_wallet_balances** - get sol and token balances
- **recipe_wallet_transactions** - get recent transaction history
- **recipe_wallet_analyze** - analyze trading patterns and behavior

### quote tools

- **recipe_quote_swap** - get jupiter swap quotes
- **recipe_quote_price** - get token price in usd
- **recipe_quote_tokens** - list supported token symbols

### strategy tools

- **recipe_strategy_templates** - get available strategy templates
- **recipe_strategy_create** - create a strategy from template
- **recipe_strategy_validate** - validate strategy configuration

## example usage

once installed, you can ask claude code things like:

> "search for bonk token and tell me its current price and volume"

> "analyze wallet ABC123... and summarize their trading activity"

> "get a quote for swapping 1 sol to usdc"

> "show me the latest pump.fun launches"

> "create a volume spike strategy for bonk with 2 sol position size"

## data sources

- **dexscreener** - token prices, volume, liquidity data
- **pump.fun** - new token launches, meme coin data
- **helius** - wallet balances, transaction history
- **jupiter** - swap quotes and routing

## notes

- this plugin is read-only - it cannot execute trades
- for live trading, use the recipe.money web app
- wallet analysis requires a helius api key
- rate limits apply to all api calls

## support

- website: [recipe.money](https://recipe.money)
- twitter: [@recipedotmoney](https://x.com/recipedotmoney)

## license

mit
