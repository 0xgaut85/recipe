#!/usr/bin/env node
/**
 * SessionStart hook for Claude Trade
 * 
 * This hook runs when a Claude Code session starts.
 * It checks if a wallet is configured and outputs context for Claude.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const walletPath = process.env.CLAUDE_TRADE_WALLET_PATH || path.join(os.homedir(), '.claude-trade', 'wallet.json');

if (fs.existsSync(walletPath)) {
  try {
    const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    console.log(`[claude-trade] Wallet configured: ${wallet.publicKey}`);
  } catch (e) {
    console.log(`[claude-trade] Wallet file exists but could not be read`);
  }
} else {
  console.log(`[claude-trade] No wallet configured. If user wants to trade, use claude_trade_wallet_create tool or run: node "${process.env.CLAUDE_PLUGIN_ROOT || ''}/scripts/setup-wallet.cjs"`);
}

process.exit(0);
