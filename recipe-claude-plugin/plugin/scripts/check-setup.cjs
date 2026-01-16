#!/usr/bin/env node
/**
 * SessionStart hook for Recipe
 * 
 * This hook runs when a Claude Code session starts.
 * It checks if a wallet is configured and outputs context for Claude.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const walletPath = process.env.RECIPE_WALLET_PATH || path.join(os.homedir(), '.recipe', 'wallet.json');

if (fs.existsSync(walletPath)) {
  try {
    const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    console.log(`[recipe] Wallet configured: ${wallet.publicKey}`);
  } catch (e) {
    console.log(`[recipe] Wallet file exists but could not be read`);
  }
} else {
  console.log(`[recipe] No wallet configured. If user wants to trade, use recipe_wallet_create tool or run: node "${process.env.CLAUDE_PLUGIN_ROOT || ''}/scripts/setup-wallet.cjs"`);
}

process.exit(0);
