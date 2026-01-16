#!/usr/bin/env node
/**
 * Wallet setup script for Recipe
 * 
 * Generates a new Solana keypair and saves it to ~/.recipe/wallet.json
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// We'll use the bundled MCP server's wallet generation
// This is a standalone script that doesn't require the full MCP server

async function main() {
  try {
    // Dynamic import for ES modules
    const { Keypair } = await import('@solana/web3.js');
    const bs58 = await import('bs58');
    
    const recipeDir = path.join(os.homedir(), '.recipe');
    const walletPath = path.join(recipeDir, 'wallet.json');
    
    // Check if wallet already exists
    if (fs.existsSync(walletPath)) {
      const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
      console.log('');
      console.log('⚠️  Wallet already exists!');
      console.log('');
      console.log('📍 Location:', walletPath);
      console.log('🔑 Public Key:', wallet.publicKey);
      console.log('');
      console.log('To create a new wallet, first delete the existing one:');
      console.log(`   rm "${walletPath}"`);
      console.log('');
      process.exit(0);
    }
    
    // Create directory if needed
    if (!fs.existsSync(recipeDir)) {
      fs.mkdirSync(recipeDir, { recursive: true });
    }
    
    // Generate new keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = bs58.default.encode(keypair.secretKey);
    
    // Save wallet
    const walletData = {
      publicKey,
      privateKey,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
    
    console.log('');
    console.log('✅ Wallet generated successfully!');
    console.log('');
    console.log('📍 Saved to:', walletPath);
    console.log('');
    console.log('🔑 Public Key (Wallet Address):');
    console.log('   ' + publicKey);
    console.log('');
    console.log('🔐 Private Key (KEEP SECRET):');
    console.log('   ' + privateKey);
    console.log('');
    console.log('⚠️  IMPORTANT - Fund your wallet before trading:');
    console.log('   • Send SOL for transaction fees (~0.01 SOL minimum)');
    console.log('   • Send tokens you want to trade');
    console.log('');
    console.log('You can send funds using Phantom, Solflare, or any Solana wallet.');
    console.log('');
    
  } catch (error) {
    console.error('Error generating wallet:', error.message);
    process.exit(1);
  }
}

main();
