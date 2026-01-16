# Recipe Claude Code Plugin

Solana trading plugin for Claude Code. Search tokens, analyze wallets, execute swaps, and create trading strategies - all from your terminal.

## Installation

### Via Claude Code Marketplace (Recommended)

```
/plugin marketplace install recipe
```

### Manual Installation

1. Clone this repository:

```bash
git clone https://github.com/recipedotmoney/recipe-claude-plugin.git
cd recipe-claude-plugin
```

2. Install dependencies and build:

```bash
npm install
npm run build
```

3. Add to your Claude Code configuration:

**For Claude Code Desktop** (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "recipe": {
      "command": "node",
      "args": ["/path/to/recipe-claude-plugin/dist/index.js"]
    }
  }
}
```

## Features

### Zero Configuration

- **No API keys needed** - All data APIs go through recipe.money's backend
- **Auto wallet generation** - A Solana wallet is created automatically on first use
- **Local key storage** - Private keys are stored at `~/.recipe/wallet.json` and never leave your machine

### Available Tools

#### Wallet Management

| Tool | Description |
|------|-------------|
| `recipe_wallet_create` | Generate a new Solana wallet or load existing |
| `recipe_wallet_info` | Get your wallet's public key, private key, and balance |
| `recipe_wallet_balance` | Get all token balances for any wallet |
| `recipe_wallet_export` | Export wallet for backup |

#### Token Discovery

| Tool | Description |
|------|-------------|
| `recipe_token_search` | Search tokens by name or symbol |
| `recipe_token_info` | Get detailed info for a token address |
| `recipe_token_trending` | Get hot tokens, volume leaders, new launches |
| `recipe_token_price` | Get current USD price |
| `recipe_token_new_launches` | Get latest Pump.fun launches |

#### Trading

| Tool | Description |
|------|-------------|
| `recipe_swap_quote` | Get a swap quote from Jupiter |
| `recipe_swap_execute` | Execute a swap with your wallet |
| `recipe_tokens_list` | List common token symbols |

#### Strategy

| Tool | Description |
|------|-------------|
| `recipe_strategy_list` | Get available strategy templates |
| `recipe_strategy_create` | Create a strategy configuration |
| `recipe_strategy_validate` | Validate a strategy config |

## Usage Examples

### Generate a Wallet

Ask Claude:
> "Create a new wallet for me"

Claude will use `recipe_wallet_create` to generate a keypair and save it locally.

### Search for Tokens

> "Search for BONK token and show me the price"

> "What are the trending tokens right now?"

> "Show me the latest Pump.fun launches"

### Execute a Swap

> "Get a quote for swapping 1 SOL to USDC"

> "Swap 0.5 SOL to BONK"

**Note:** Make sure your wallet has SOL before swapping! Send SOL to your public key address.

### Create a Strategy

> "Show me available trading strategies"

> "Create a volume spike strategy for BONK with 1 SOL position size"

## Wallet Security

- **Private keys are stored locally** at `~/.recipe/wallet.json`
- **Keys never leave your machine** - they're used only for signing transactions locally
- **Back up your wallet file** - losing it means losing access to your funds
- **Never share your private key** - anyone with it can steal your funds

## Supported Tokens

Common tokens can be referenced by symbol:

| Symbol | Description |
|--------|-------------|
| SOL | Solana |
| USDC | USD Coin |
| USDT | Tether |
| BONK | Bonk |
| WIF | dogwifhat |
| JUP | Jupiter |
| POPCAT | Popcat |
| PYTH | Pyth Network |

You can also use any valid Solana mint address.

## Data Sources

- **Token Data**: DexScreener, Pump.fun, recipe.money API
- **Prices & Swaps**: Jupiter Aggregator
- **Wallet Balances**: Solana RPC, recipe.money API (Helius)
- **Trending**: recipe.money API (Birdeye)

## Troubleshooting

### "No wallet found"

Run any wallet command to generate one:
> "Show my wallet"

### "Insufficient balance"

Your wallet needs SOL to trade. Send SOL to your public key address shown in wallet info.

### "Swap failed"

- Check you have enough balance (including fees)
- Try increasing slippage for volatile tokens
- Make sure the token has liquidity

## Support

- Website: [recipe.money](https://recipe.money)
- Twitter: [@recipedotmoney](https://x.com/recipedotmoney)

## License

MIT
