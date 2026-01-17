/**
 * Local Wallet Management for Claude Code Plugin
 * Generates and stores a Solana wallet locally
 */

import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import bs58 from "bs58";

const WALLET_DIR = path.join(os.homedir(), ".claude-trade");
const WALLET_FILE = path.join(WALLET_DIR, "wallet.json");

interface LocalWallet {
  publicKey: string;
  privateKey: string;
  createdAt: string;
  warning: string;
}

/**
 * Ensure the wallet directory exists
 */
function ensureWalletDir(): void {
  if (!fs.existsSync(WALLET_DIR)) {
    fs.mkdirSync(WALLET_DIR, { recursive: true });
  }
}

/**
 * Check if a wallet already exists
 */
export function walletExists(): boolean {
  return fs.existsSync(WALLET_FILE);
}

/**
 * Generate a new wallet and save it locally
 */
export function generateWallet(): LocalWallet {
  ensureWalletDir();

  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKey = bs58.encode(keypair.secretKey);

  const wallet: LocalWallet = {
    publicKey,
    privateKey,
    createdAt: new Date().toISOString(),
    warning: "NEVER SHARE THIS FILE. Your private key controls your funds.",
  };

  fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2), "utf-8");

  return wallet;
}

/**
 * Load existing wallet from file
 */
export function loadWallet(): LocalWallet | null {
  if (!walletExists()) {
    return null;
  }

  try {
    const content = fs.readFileSync(WALLET_FILE, "utf-8");
    return JSON.parse(content) as LocalWallet;
  } catch (error) {
    console.error("Failed to load wallet:", error);
    return null;
  }
}

/**
 * Get or create wallet
 * Returns the wallet and whether it was newly created
 */
export function getOrCreateWallet(): { wallet: LocalWallet; isNew: boolean } {
  const existing = loadWallet();
  if (existing) {
    return { wallet: existing, isNew: false };
  }

  const newWallet = generateWallet();
  return { wallet: newWallet, isNew: true };
}

/**
 * Get keypair from stored wallet
 */
export function getKeypair(): Keypair | null {
  const wallet = loadWallet();
  if (!wallet) {
    return null;
  }

  try {
    const secretKey = bs58.decode(wallet.privateKey);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error("Failed to create keypair:", error);
    return null;
  }
}

/**
 * Delete the wallet file (use with caution!)
 */
export function deleteWallet(): boolean {
  if (!walletExists()) {
    return false;
  }

  try {
    fs.unlinkSync(WALLET_FILE);
    return true;
  } catch (error) {
    console.error("Failed to delete wallet:", error);
    return false;
  }
}

/**
 * Get wallet file path
 */
export function getWalletPath(): string {
  return WALLET_FILE;
}

/**
 * Display wallet info (for CLI output)
 */
export function displayWalletInfo(wallet: LocalWallet, isNew: boolean): string {
  const lines = [
    "",
    "═══════════════════════════════════════════════════════════════",
    isNew ? "  🆕 NEW WALLET GENERATED" : "  💼 WALLET LOADED",
    "═══════════════════════════════════════════════════════════════",
    "",
    `  Public Key:  ${wallet.publicKey}`,
    "",
    `  Private Key: ${wallet.privateKey}`,
    "",
    `  Created:     ${wallet.createdAt}`,
    "",
    `  Stored at:   ${WALLET_FILE}`,
    "",
    "═══════════════════════════════════════════════════════════════",
    "  ⚠️  WARNING: NEVER SHARE YOUR PRIVATE KEY",
    "  ⚠️  Anyone with your private key can steal your funds",
    "  ⚠️  Back up this file securely",
    "═══════════════════════════════════════════════════════════════",
    "",
  ];

  return lines.join("\n");
}
