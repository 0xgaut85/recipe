# Recipe - Solana Trading Plugin

You have access to Recipe MCP tools for Solana trading, token discovery, and strategy creation.

## Available Tools

### Token Discovery (No wallet required)
- `recipe_token_search` - Search for tokens by name or symbol
- `recipe_token_info` - Get detailed token information by address
- `recipe_token_trending` - Get trending tokens from Birdeye
- `recipe_token_price` - Get current token price
- `recipe_token_new_launches` - Get newly launched tokens from Pump.fun
- `recipe_get_new_pairs` - Get new trading pairs with filters
- `recipe_get_pair_details` - Get detailed metrics for a trading pair
- `recipe_get_ohlcv` - Get OHLCV candle data for a token
- `recipe_calculate_ema` - Calculate EMA and check price position

### Wallet Management
- `recipe_wallet_create` - Generate a new Solana wallet (saved locally)
- `recipe_wallet_info` - View wallet address and balances
- `recipe_wallet_balance` - Get detailed token balances
- `recipe_wallet_export` - Export wallet keys (use with caution!)

### Trading (Wallet required)
- `recipe_swap_quote` - Get a swap quote without executing
- `recipe_swap_execute` - Execute a swap (WARNING: uses real funds!)
- `recipe_quick_buy` - Quick buy: SOL → Token
- `recipe_quick_sell` - Quick sell: Token → SOL
- `recipe_tokens_list` - List supported tokens

### Strategy Creation
- `recipe_strategy_create` - Create a trading strategy (SPOT, SNIPER, CONDITIONAL)
- `recipe_strategy_list` - List strategy templates
- `recipe_strategy_validate` - Validate a strategy configuration

## Wallet Setup

The wallet is stored at `~/.recipe/wallet.json`. If a user wants to trade but doesn't have a wallet, guide them through setup using the recipe-setup skill.

## Common Workflows

### Token Research
1. Use `recipe_token_search` to find tokens by name
2. Use `recipe_token_info` to get detailed metrics
3. Use `recipe_token_trending` to see what's hot
4. Use `recipe_get_ohlcv` for price history

### Quick Trading
1. Check wallet with `recipe_wallet_info`
2. Get a quote with `recipe_swap_quote`
3. Execute with `recipe_quick_buy` or `recipe_quick_sell`

### Strategy Creation
1. Research the token first
2. Use `recipe_strategy_create` with type: SPOT, SNIPER, or CONDITIONAL
3. Validate with `recipe_strategy_validate`

## Important Notes

- **Real Money**: All trades use real SOL/tokens - there's no testnet mode
- **Slippage**: Default is 1% (100 bps) - adjust for volatile tokens
- **Fees**: Solana transactions cost ~0.000005 SOL
- **Private Keys**: Never share your wallet.json file
- **Data Sources**: Token data from Birdeye, DexScreener, and Pump.fun via recipe.money
