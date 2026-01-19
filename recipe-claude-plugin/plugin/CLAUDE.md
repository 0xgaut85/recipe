# Claude Trade - Solana Trading Plugin

You have access to Claude Trade MCP tools for Solana trading, token discovery, and strategy creation.

## Available Tools

### Token Discovery (No wallet required)
- `claude_trade_token_search` - Search for tokens by name or symbol
- `claude_trade_token_info` - Get detailed token information by address
- `claude_trade_token_trending` - Get trending tokens from Birdeye
- `claude_trade_token_price` - Get current token price
- `claude_trade_token_new_launches` - Get newly launched tokens from Pump.fun
- `claude_trade_get_new_pairs` - Get new trading pairs with filters
- `claude_trade_get_pair_details` - Get detailed metrics for a trading pair
- `claude_trade_get_ohlcv` - Get OHLCV candle data for a token
- `claude_trade_calculate_ema` - Calculate EMA and check price position

### Wallet Management
- `claude_trade_wallet_create` - Generate a new Solana wallet (saved locally)
- `claude_trade_wallet_info` - View wallet address and balances
- `claude_trade_wallet_balance` - Get detailed token balances
- `claude_trade_wallet_export` - Export wallet keys (use with caution!)

### Trading (Wallet required)
- `claude_trade_swap_quote` - Get a swap quote without executing
- `claude_trade_swap_execute` - Execute a swap (WARNING: uses real funds!)
- `claude_trade_quick_buy` - Quick buy: SOL → Token
- `claude_trade_quick_sell` - Quick sell: Token → SOL
- `claude_trade_tokens_list` - List supported tokens

### Strategy Creation
- `claude_trade_strategy_create` - Create a trading strategy (SPOT, SNIPER, CONDITIONAL)
- `claude_trade_strategy_list` - List strategy templates
- `claude_trade_strategy_validate` - Validate a strategy configuration

## Wallet Setup

The wallet is stored at `~/.claude-trade/wallet.json`. If a user wants to trade but doesn't have a wallet, guide them through setup using the claude-trade-setup skill.

## Common Workflows

### Token Research
1. Use `claude_trade_token_search` to find tokens by name
2. Use `claude_trade_token_info` to get detailed metrics
3. Use `claude_trade_token_trending` to see what's hot
4. Use `claude_trade_get_ohlcv` for price history

### Quick Trading
1. Check wallet with `claude_trade_wallet_info`
2. Get a quote with `claude_trade_swap_quote`
3. Execute with `claude_trade_quick_buy` or `claude_trade_quick_sell`

### Strategy Creation
1. Research the token first
2. Use `claude_trade_strategy_create` with type: SPOT, SNIPER, or CONDITIONAL
3. Validate with `claude_trade_strategy_validate`

## Important Notes

- **Real Money**: All trades use real SOL/tokens - there's no testnet mode
- **Slippage**: Default is 1% (100 bps) - adjust for volatile tokens
- **Fees**: Solana transactions cost ~0.000005 SOL
- **Private Keys**: Never share your wallet.json file
- **Data Sources**: Token data from Birdeye, DexScreener, and Pump.fun via claudetrade.com
