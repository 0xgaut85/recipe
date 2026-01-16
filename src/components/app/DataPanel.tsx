"use client";

import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, QrCode, ExternalLink } from "lucide-react";
import type { CookingStep } from "@/app/app/page";

interface TokenData {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap?: number;
  rank?: number;
}

interface WalletData {
  publicKey: string;
  solBalance: number;
  profile?: {
    name: string;
    avatar: string | null;
    bio: string | null;
    xHandle: string | null;
    showOnLeaderboard: boolean;
  };
}

interface DataPanelProps {
  currentStep: CookingStep;
  walletData?: WalletData | null;
}

export const DataPanel: FC<DataPanelProps> = ({ currentStep, walletData }) => {
  const [activeTab, setActiveTab] = useState<"market" | "wallet" | "strategy">("market");
  const [trendingTokens, setTrendingTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Update wallet loading state when walletData changes
  useEffect(() => {
    if (walletData !== undefined) {
      setIsWalletLoading(false);
    }
  }, [walletData]);

  // Fetch trending tokens
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("/api/data/trending");
        if (res.ok) {
          const data = await res.json();
          setTrendingTokens(data.trendingPairs || []);
        }
      } catch (error) {
        console.error("Failed to fetch trending:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
    const interval = setInterval(fetchTrending, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyAddress = () => {
    if (walletData?.publicKey) {
      navigator.clipboard.writeText(walletData.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  const formatPrice = (price: number) => {
    if (!price) return "$0.00";
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="h-full flex flex-col bg-white/[0.02] border-l border-white/10">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: "market", label: "market" },
          { id: "wallet", label: "wallet" },
          { id: "strategy", label: "strategy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-3 text-sm font-bold lowercase transition-colors ${
              activeTab === tab.id
                ? "text-white border-b-2 border-accent-pink"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto terminal-scroll p-4">
        {/* Market Tab */}
        {activeTab === "market" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">
                trending tokens
              </h3>
              <span className="text-white/30 text-xs">24h</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="bg-white/5 rounded-xl p-4 animate-pulse"
                  >
                    <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : trendingTokens.length > 0 ? (
              trendingTokens.map((token, i) => (
                <motion.a
                  key={token.address || i}
                  href={`https://birdeye.so/token/${token.address}?chain=solana`}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="block bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {/* Token Logo */}
                      {token.logoURI ? (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full bg-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-pink/50 to-accent-blue/50 flex items-center justify-center text-white text-xs font-bold">
                          {token.symbol?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold">{token.symbol}</span>
                          <ExternalLink size={10} className="text-white/30" />
                        </div>
                        <span className="text-white/40 text-xs">{token.name}</span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        (token.priceChange24h || 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {(token.priceChange24h || 0) >= 0 ? "+" : ""}
                      {(token.priceChange24h || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-white font-medium">
                      {formatPrice(parseFloat(String(token.price)))}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white/50">
                        Vol: {formatNumber(token.volume24h || 0)}
                      </span>
                      {token.marketCap && token.marketCap > 0 && (
                        <span className="text-white/40">
                          MC: {formatNumber(token.marketCap)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.a>
              ))
            ) : (
              <div className="text-center py-8 text-white/40">
                <p className="text-sm">no data available</p>
                <p className="text-xs mt-1">check your connection</p>
              </div>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="space-y-4">
            {isWalletLoading ? (
              // Loading skeleton for wallet tab
              <div className="space-y-4 animate-pulse">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-white/10 rounded w-full mb-2" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="h-4 bg-white/10 rounded w-1/4 mb-3" />
                  <div className="h-8 bg-white/10 rounded w-1/2" />
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-white/10 rounded w-full mb-2" />
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                </div>
              </div>
            ) : (
              <>
            {/* Deposit Address */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">
                  deposit address
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="text-white/40 hover:text-white transition-colors"
                    title="Show QR Code"
                  >
                    <QrCode size={16} />
                  </button>
                  <button
                    onClick={copyAddress}
                    className="text-white/40 hover:text-white transition-colors"
                    title="Copy Address"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <p className="text-white/80 text-xs font-mono break-all">
                {walletData?.publicKey || "no wallet"}
              </p>
              {showQR && walletData?.publicKey && (
                <div className="mt-4 flex justify-center">
                  <div className="bg-white p-4 rounded-xl">
                    {/* QR Code would go here - using placeholder */}
                    <div className="w-32 h-32 bg-ink/10 flex items-center justify-center text-ink/40 text-xs">
                      QR Code
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Balance */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">
                balance
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-white text-2xl font-bold">
                  {(walletData?.solBalance || 0).toFixed(4)}
                </span>
                <span className="text-white/60">SOL</span>
              </div>
              <p className="text-white/40 text-sm mt-1">
                ≈ ${((walletData?.solBalance || 0) * 150).toFixed(2)} USD
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://solscan.io/account/${walletData?.publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors"
              >
                <span className="text-white/60 text-sm">view on solscan</span>
              </a>
              <a
                href={`https://jup.ag/swap/SOL-USDC`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors"
              >
                <span className="text-white/60 text-sm">buy sol</span>
              </a>
            </div>
              </>
            )}
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === "strategy" && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
                current strategy
              </h3>
              <p className="text-white/40 text-sm">
                {currentStep === "describe"
                  ? "no strategy defined yet. describe what you want to do in the chat."
                  : currentStep === "cook"
                  ? "refining strategy parameters..."
                  : currentStep === "taste"
                  ? "testing strategy against live data..."
                  : "strategy ready for execution."}
              </p>
            </div>

            {/* Strategy Preview */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent-pink" />
                <span className="text-white/60 text-xs uppercase tracking-wider">
                  step: {currentStep}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">type</span>
                  <span className="text-white">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">token</span>
                  <span className="text-white">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">amount</span>
                  <span className="text-white">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">condition</span>
                  <span className="text-white">—</span>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-xl p-4">
              <p className="text-accent-blue text-sm">
                tip: tell the AI what you want to trade and under what conditions.
                for example: &quot;buy SOL when it drops 5% in the last hour&quot;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 flex items-center justify-between text-xs text-white/30">
        <span>solana mainnet</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>connected</span>
        </div>
      </div>
    </div>
  );
};
