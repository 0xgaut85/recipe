# Recipe Wallet Setup Skill

This skill helps users set up their Solana wallet for Recipe trading.

## Trigger Phrases
- "set up my recipe wallet"
- "create recipe wallet"
- "configure recipe"
- "setup recipe trading"

## Workflow

### Step 1: Check Existing Wallet
First, check if a wallet already exists:

```bash
cat ~/.recipe/wallet.json 2>/dev/null || echo "No wallet found"
```

### Step 2: Generate Wallet
If no wallet exists, use the MCP tool or run the setup script:

**Option A - Use MCP Tool (Recommended):**
Simply call the `recipe_wallet_create` tool.

**Option B - Run Script:**
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-wallet.cjs"
```

### Step 3: Fund the Wallet
After wallet creation, tell the user:

1. Their wallet address (public key)
2. They need to send SOL for transaction fees (~0.01 SOL minimum)
3. They can send tokens they want to trade
4. How to check balance using `recipe_wallet_info` tool

### Step 4: Verify Setup
Once funded, verify with:
> Try asking me to check your wallet balance to verify everything works!

## Notes
- The wallet is stored locally at `~/.recipe/wallet.json`
- Never share or expose the wallet.json file
- All trades use real funds - there's no testnet mode
- Transaction fees are ~0.000005 SOL per transaction
