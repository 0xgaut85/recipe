import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { encrypt, decrypt } from "./encryption";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";

/**
 * Get Solana connection
 */
export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

/**
 * Generate a new Solana keypair
 * Returns the public key and encrypted private key
 */
export function generateWallet(): {
  publicKey: string;
  encryptedPrivateKey: string;
} {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKeyBase58 = bs58.encode(keypair.secretKey);
  const encryptedPrivateKey = encrypt(privateKeyBase58);

  return {
    publicKey,
    encryptedPrivateKey,
  };
}

/**
 * Decrypt and reconstruct a Keypair from encrypted private key
 */
export function getKeypairFromEncrypted(encryptedPrivateKey: string): Keypair {
  const privateKeyBase58 = decrypt(encryptedPrivateKey);
  const secretKey = bs58.decode(privateKeyBase58);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Get SOL balance for a wallet
 */
export async function getBalance(publicKey: string): Promise<number> {
  const connection = getConnection();
  const pubkey = new PublicKey(publicKey);
  const balance = await connection.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Validate a Solana public key
 */
export function isValidPublicKey(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

/**
 * Minimum SOL to keep for rent exemption
 */
export const RENT_EXEMPT_MINIMUM = 0.00089;

/**
 * Network fee estimate (can vary with congestion)
 */
export const NETWORK_FEE_ESTIMATE = 0.000005;

/**
 * Platform fee for withdrawals
 */
export const PLATFORM_WITHDRAWAL_FEE = parseFloat(process.env.WITHDRAWAL_FEE_SOL || "0.001");

/**
 * Minimum withdrawal amount
 */
export const MIN_WITHDRAWAL_AMOUNT = parseFloat(process.env.MIN_WITHDRAWAL_SOL || "0.01");

/**
 * Maximum daily withdrawals
 */
export const MAX_DAILY_WITHDRAWALS = parseInt(process.env.MAX_DAILY_WITHDRAWALS || "10", 10);

/**
 * Withdraw SOL from a wallet to a destination address
 */
export async function withdrawSol(
  encryptedPrivateKey: string,
  destinationAddress: string,
  amount: number
): Promise<{
  signature: string;
  fee: number;
  netAmount: number;
}> {
  // Validate destination address
  if (!isValidPublicKey(destinationAddress)) {
    throw new Error("Invalid destination address");
  }

  // Validate amount
  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} SOL`);
  }

  const connection = getConnection();
  const keypair = getKeypairFromEncrypted(encryptedPrivateKey);
  const destination = new PublicKey(destinationAddress);

  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  const balanceSol = balance / LAMPORTS_PER_SOL;

  // Calculate total fee
  const totalFee = NETWORK_FEE_ESTIMATE + PLATFORM_WITHDRAWAL_FEE;
  const requiredBalance = amount + totalFee + RENT_EXEMPT_MINIMUM;

  if (balanceSol < requiredBalance) {
    throw new Error(
      `Insufficient balance. Have: ${balanceSol.toFixed(4)} SOL, Need: ${requiredBalance.toFixed(4)} SOL (including fees and rent)`
    );
  }

  // Build transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: destination,
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })
  );

  // Send and confirm transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
    commitment: "confirmed",
    maxRetries: 3,
  });

  return {
    signature,
    fee: totalFee,
    netAmount: amount,
  };
}

/**
 * Get token accounts for a wallet (simplified - returns SPL token balances)
 */
export async function getTokenAccounts(publicKey: string): Promise<
  Array<{
    mint: string;
    balance: number;
    decimals: number;
  }>
> {
  const connection = getConnection();
  const pubkey = new PublicKey(publicKey);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });

  return tokenAccounts.value.map((account) => {
    const parsed = account.account.data.parsed.info;
    return {
      mint: parsed.mint,
      balance: parsed.tokenAmount.uiAmount || 0,
      decimals: parsed.tokenAmount.decimals,
    };
  });
}

/**
 * Sign a transaction with the wallet
 */
export function signTransaction(
  transaction: Transaction,
  encryptedPrivateKey: string
): Transaction {
  const keypair = getKeypairFromEncrypted(encryptedPrivateKey);
  transaction.sign(keypair);
  return transaction;
}
