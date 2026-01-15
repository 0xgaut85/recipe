# VibeTrade - Solana Trading DApp

A modern, performant trading DApp built on Solana with Next.js 14, Tailwind CSS, and Framer Motion.

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Blockchain**: Solana (web3.js + Wallet Adapter)
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 11
- **Language**: TypeScript 5
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm run start
```

## Wallet Support

The DApp supports popular Solana wallets:
- Phantom
- Solflare

## Deployment on Railway

1. Connect your GitHub repository to Railway
2. Railway will auto-detect the Next.js app
3. Deploy!

The `railway.json` configuration is included for optimal deployment settings.

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles + Tailwind
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Home page
├── components/
│   ├── Features.tsx     # Features section
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Hero section
│   └── WalletProvider.tsx # Solana wallet context
```

## Environment Variables

For production, you may want to configure:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_url
NEXT_PUBLIC_NETWORK=mainnet-beta
```

## License

MIT
