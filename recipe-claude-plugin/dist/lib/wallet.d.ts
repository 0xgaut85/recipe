/**
 * Local Wallet Manager
 * Generates and stores Solana wallet locally - keys never leave the user's machine
 */
import { Keypair, Connection } from "@solana/web3.js";
export interface LocalWallet {
    publicKey: string;
    privateKey: string;
    createdAt: string;
}
/**
 * Check if wallet exists
 */
export declare function walletExists(): boolean;
/**
 * Generate a new Solana wallet
 */
export declare function generateWallet(): LocalWallet;
/**
 * Load existing wallet
 */
export declare function loadWallet(): LocalWallet | null;
/**
 * Get or create wallet - returns wallet and whether it's new
 */
export declare function getOrCreateWallet(): {
    wallet: LocalWallet;
    isNew: boolean;
};
/**
 * Get keypair from wallet for signing transactions
 */
export declare function getKeypair(): Keypair | null;
/**
 * Get SOL balance for wallet
 */
export declare function getSolBalance(publicKey: string): Promise<number>;
/**
 * Get Solana connection
 */
export declare function getConnection(): Connection;
/**
 * Get wallet file path
 */
export declare function getWalletPath(): string;
/**
 * Delete wallet (use with caution!)
 */
export declare function deleteWallet(): boolean;
/**
 * Format wallet info for display
 */
export declare function formatWalletInfo(wallet: LocalWallet, isNew: boolean): string;
//# sourceMappingURL=wallet.d.ts.map