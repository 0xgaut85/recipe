/**
 * Local Wallet Manager
 * Generates and stores Solana wallet locally - keys never leave the user's machine
 */
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import bs58 from "bs58";
const WALLET_DIR = path.join(os.homedir(), ".claude-trade");
const WALLET_FILE = path.join(WALLET_DIR, "wallet.json");
// Public Solana RPC - no API key needed
const RPC_URL = "https://api.mainnet-beta.solana.com";
/**
 * Ensure wallet directory exists
 */
function ensureWalletDir() {
    if (!fs.existsSync(WALLET_DIR)) {
        fs.mkdirSync(WALLET_DIR, { recursive: true });
    }
}
/**
 * Check if wallet exists
 */
export function walletExists() {
    return fs.existsSync(WALLET_FILE);
}
/**
 * Generate a new Solana wallet
 */
export function generateWallet() {
    ensureWalletDir();
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = bs58.encode(keypair.secretKey);
    const wallet = {
        publicKey,
        privateKey,
        createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2), "utf-8");
    return wallet;
}
/**
 * Load existing wallet
 */
export function loadWallet() {
    if (!walletExists()) {
        return null;
    }
    try {
        const content = fs.readFileSync(WALLET_FILE, "utf-8");
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Get or create wallet - returns wallet and whether it's new
 */
export function getOrCreateWallet() {
    const existing = loadWallet();
    if (existing) {
        return { wallet: existing, isNew: false };
    }
    const newWallet = generateWallet();
    return { wallet: newWallet, isNew: true };
}
/**
 * Get keypair from wallet for signing transactions
 */
export function getKeypair() {
    const wallet = loadWallet();
    if (!wallet) {
        return null;
    }
    try {
        const secretKey = bs58.decode(wallet.privateKey);
        return Keypair.fromSecretKey(secretKey);
    }
    catch {
        return null;
    }
}
/**
 * Get SOL balance for wallet
 */
export async function getSolBalance(publicKey) {
    try {
        const connection = new Connection(RPC_URL, "confirmed");
        const balance = await connection.getBalance(new PublicKey(publicKey));
        return balance / LAMPORTS_PER_SOL;
    }
    catch {
        return 0;
    }
}
/**
 * Get Solana connection
 */
export function getConnection() {
    return new Connection(RPC_URL, "confirmed");
}
/**
 * Get wallet file path
 */
export function getWalletPath() {
    return WALLET_FILE;
}
/**
 * Delete wallet (use with caution!)
 */
export function deleteWallet() {
    if (!walletExists()) {
        return false;
    }
    try {
        fs.unlinkSync(WALLET_FILE);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Format wallet info for display
 */
export function formatWalletInfo(wallet, isNew) {
    const lines = [
        "",
        "═══════════════════════════════════════════════════════════════",
        isNew ? "  NEW WALLET GENERATED" : "  WALLET LOADED",
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
        "  WARNING: NEVER SHARE YOUR PRIVATE KEY",
        "  Anyone with your private key can steal your funds",
        "  Back up this file securely",
        "═══════════════════════════════════════════════════════════════",
        "",
    ];
    return lines.join("\n");
}
//# sourceMappingURL=wallet.js.map