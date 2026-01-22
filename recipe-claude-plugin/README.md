# Claude Trade Plugin

Solana trading plugin for Claude Code. Search tokens, analyze wallets, execute swaps, and create trading strategies - all from your terminal.

## Installation

### Via Claude Code Marketplace (Recommended)

```
/plugin marketplace install claude-trade
```

### Manual Installation

1. Clone this repository:

```bash
git clone https://github.com/thinkbigcd/claude-trade.git
cd claude-trade/plugin
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
    "claude-trade": {
      "command": "node",
      "args": ["/path/to/claude-trade/plugin/dist/index.js"]
    }
  }
}
```

## Features

### Zero Configuration

- **No API keys needed** - All data APIs go through claudetrade.com's backend
- **Auto wallet generation** - A Solana wallet is created automatically on first use
- **Local key storage** - Private keys are stored at `~/.claude-trade/wallet.json` and never leave your machine

### Available Tools

#### Wallet Management

| Tool | Description |
|------|-------------|
| `claude_trade_wallet_create` | Generate a new Solana wallet or load existing |
| `claude_trade_wallet_info` | Get your wallet's public key, private key, and balance |
| `claude_trade_wallet_balance` | Get all token balances for any wallet |
| `claude_trade_wallet_export` | Export wallet for backup |

#### Token Discovery & Analysis

| Tool | Description |
|------|-------------|
| `claude_trade_token_search` | Search tokens with advanced filters (symbol, name, mcap, liquidity, holders) |
| `claude_trade_token_info` | Get detailed info for a token address or symbol |
| `claude_trade_token_trending` | Get trending tokens on Solana by volume |
| `claude_trade_token_price` | Get current USD price |
| `claude_trade_token_new_launches` | Get latest Pump.fun launches |
| `claude_trade_get_ohlcv` | Get OHLCV candle data for technical analysis |
| `claude_trade_calculate_ema` | Calculate EMA and check if price is above/below |
| `claude_trade_get_new_pairs` | Get new pairs with filters (age, liquidity, volume, mcap) |
| `claude_trade_get_pair_details` | Get detailed metrics (30m/1h volume, trades, price changes) |

#### Trading

| Tool | Description |
|------|-------------|
| `claude_trade_swap_quote` | Get a swap quote from Jupiter (supports token names, symbols, or addresses) |
| `claude_trade_swap_execute` | Execute a swap with your wallet |
| `claude_trade_tokens_list` | List common token symbols |

#### Strategy

| Tool | Description |
|------|-------------|
| `claude_trade_strategy_list` | Get example strategy configurations |
| `claude_trade_strategy_create` | Create a SNIPER, SPOT, or CONDITIONAL strategy |
| `claude_trade_strategy_validate` | Validate a strategy config |

## Usage Examples

### Generate a Wallet

Ask Claude:
> "Create a new wallet for me"

Claude will use `claude_trade_wallet_create` to generate a keypair and save it locally.

### Search for Tokens

> "Search for BONK token and show me the price"

> "What are the trending tokens right now?"

> "Show me the latest Pump.fun launches"

> "Find tokens with symbol starting with 'AI' and market cap over $1M"

### Technical Analysis

> "Get the 4H OHLCV data for BONK"

> "Calculate the 50-period EMA for WIF on the 1H timeframe"

> "Show me new pairs launched in the last 15 minutes with at least $10k liquidity"

### Execute a Swap

> "Get a quote for swapping 1 SOL to USDC"

> "Swap 0.5 SOL to BONK"

**Note:** Make sure your wallet has SOL before swapping! Send SOL to your public key address.

### Create a Strategy

> "Show me example trading strategies"

> "Create a sniper strategy for AI-themed tokens with min $50k market cap"

> "Create a conditional strategy to buy BONK when price crosses above 50 EMA"

## Strategy Types

### SNIPER
Automatically snipe new token launches matching your criteria:
- `maxAgeMinutes` - How fresh the token must be
- `minLiquidity` / `maxLiquidity` - Liquidity range
- `minMarketCap` / `maxMarketCap` - Market cap range
- `nameFilter` - Filter by name (e.g., "ai", "meme")
- `takeProfit` / `stopLoss` - Exit conditions

### SPOT
Simple token swap with optional risk management:
- `inputToken` / `outputToken` - Tokens to trade
- `amount` - Trade size
- `direction` - buy or sell
- `stopLoss` / `takeProfit` - Optional exit conditions

### CONDITIONAL
Trade when technical conditions are met:
- `indicator` - EMA, RSI, SMA, or PRICE
- `period` - Indicator period (e.g., 20, 50, 200)
- `timeframe` - 1m, 5m, 15m, 1H, 4H, 1D
- `trigger` - price_above, price_below, crosses_above, crosses_below, price_touches

## Wallet Security

- **Private keys are stored locally** at `~/.claude-trade/wallet.json`
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
| RAY | Raydium |
| ORCA | Orca |
| JITO | Jito |
| RENDER | Render |

You can also use any valid Solana mint address, or search by token name!

## Data Sources

- **Token Data**: DexScreener, Pump.fun, claudetrade.com API (Birdeye)
- **OHLCV & Indicators**: claudetrade.com API (Birdeye)
- **Prices & Swaps**: Jupiter Aggregator
- **Wallet Balances**: Solana RPC, claudetrade.com API (Helius)
- **Trending & New Pairs**: claudetrade.com API (Birdeye)

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

### "Could not find token"

- Try using the contract address (CA) instead of the symbol
- Make sure the token exists and has liquidity

## Support

- Website: [claudetrade.com](https://claudetrade.com)
- Twitter: [@claudetrade](https://x.com/claudetrade)

## License

MIT
