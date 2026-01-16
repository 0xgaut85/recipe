"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, QrCode, ExternalLink, Flame, Zap, Clock, TrendingUp, PieChart, RefreshCw, Play, Pause, Trash2, X, Activity, Radio, ArrowUpRight, ArrowDownRight, Search, AlertCircle, ShoppingCart, DollarSign } from "lucide-react";
import type { CookingStep } from "@/app/app/page";
import { toast } from "sonner";

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
  listedAt?: number;
}

interface MarketData {
  hotTokens: TokenData[];
  newPairs: TokenData[];
  highVolume: TokenData[];
}

interface Position {
  mint: string;
  symbol: string;
  name: string;
  logoURI?: string;
  balance: number;
  price: number;
  value: number;
  priceChange24h: number;
}

interface PositionsData {
  positions: Position[];
  totalValue: number;
  solBalance: number;
  tokenCount: number;
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

type MarketSection = "hot" | "new" | "volume";

export const DataPanel: FC<DataPanelProps> = ({ currentStep, walletData }) => {
  const [activeTab, setActiveTab] = useState<"market" | "positions" | "wallet" | "strategy">("market");
  const [marketSection, setMarketSection] = useState<MarketSection>("hot");
  const [marketData, setMarketData] = useState<MarketData>({
    hotTokens: [],
    newPairs: [],
    highVolume: [],
  });
  const [positionsData, setPositionsData] = useState<PositionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPositionsLoading, setIsPositionsLoading] = useState(true);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // Multiple strategies support
  const [strategies, setStrategies] = useState<Array<{
    id: string;
    name: string;
    description: string;
    config: any;
    isActive: boolean;
    createdAt: string;
  }>>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<{
    id: string;
    name: string;
    description: string;
    config: any;
    isActive: boolean;
    createdAt: string;
  } | null>(null);
  const [isStrategyLoading, setIsStrategyLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [showMonitor, setShowMonitor] = useState(false);
  const [isUpdatingStrategy, setIsUpdatingStrategy] = useState(false);
  // Fresh balance from positions API for wallet tab
  const [freshSolBalance, setFreshSolBalance] = useState<number | null>(null);
  const [isWalletBalanceLoading, setIsWalletBalanceLoading] = useState(false);
  // Strategy activity log
  const [activityLog, setActivityLog] = useState<Array<{
    id: string;
    type: "scan" | "check" | "buy" | "sell" | "error" | "info";
    message: string;
    timestamp: string;
    details?: { token?: string; amount?: number; price?: number; signature?: string };
  }>>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  // Position trading
  const [tradingPosition, setTradingPosition] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [isTrading, setIsTrading] = useState(false);

  // Update wallet loading state when walletData changes
  useEffect(() => {
    if (walletData !== undefined) {
      setIsWalletLoading(false);
    }
  }, [walletData]);

  // Fetch SOL price on mount and periodically
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        // Use CoinGecko simple price API (free, no key required)
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        if (res.ok) {
          const data = await res.json();
          if (data.solana?.usd) {
            setSolPrice(data.solana.usd);
          }
        }
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
        // Fallback to a reasonable estimate if API fails
        setSolPrice(200);
      }
    };

    fetchSolPrice();
    // Refresh price every 60 seconds
    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch positions when positions tab is active
  const fetchPositions = async () => {
    setIsPositionsLoading(true);
    try {
      const res = await fetch("/api/data/positions");
      if (res.ok) {
        const data = await res.json();
        setPositionsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch positions:", error);
    } finally {
      setIsPositionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "positions") {
      fetchPositions();
      const interval = setInterval(fetchPositions, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Fetch all strategies when strategy tab is active
  const fetchStrategies = async () => {
    setIsStrategyLoading(true);
    try {
      const res = await fetch("/api/strategies");
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies || []);
      }
    } catch (error) {
      console.error("Failed to fetch strategies:", error);
    } finally {
      setIsStrategyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "strategy") {
      fetchStrategies();
      // Poll for new strategies every 5 seconds when on strategy tab
      const interval = setInterval(fetchStrategies, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, currentStep]); // Refetch when step changes too

  // Fetch fresh wallet balance when wallet tab is active
  const fetchWalletBalance = async () => {
    setIsWalletBalanceLoading(true);
    try {
      const res = await fetch("/api/data/positions");
      if (res.ok) {
        const data = await res.json();
        setFreshSolBalance(data.solBalance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    } finally {
      setIsWalletBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "wallet") {
      fetchWalletBalance();
      // Refresh balance every 30 seconds when on wallet tab
      const interval = setInterval(fetchWalletBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Fetch activity log for selected strategy
  const fetchActivityLog = async (strategyId: string) => {
    setIsActivityLoading(true);
    try {
      const res = await fetch(`/api/strategies/${strategyId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivityLog(data.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setIsActivityLoading(false);
    }
  };

  // Fetch activity when monitor opens
  useEffect(() => {
    if (showMonitor && selectedStrategy) {
      fetchActivityLog(selectedStrategy.id);
      // Poll for updates every 5 seconds
      const interval = setInterval(() => fetchActivityLog(selectedStrategy.id), 5000);
      return () => clearInterval(interval);
    }
  }, [showMonitor, selectedStrategy]);

  // Execute quick trade
  const executeQuickTrade = async (action: "buy" | "sell", tokenMint: string, amount: number) => {
    setIsTrading(true);
    try {
      const res = await fetch("/api/trade/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tokenMint, amount, slippageBps: 100 }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`${action === "buy" ? "Bought" : "Sold"} successfully!`);
        // Refresh positions
        fetchPositions();
        setTradingPosition(null);
        setTradeAmount("");
      } else {
        toast.error(data.error || "Trade failed");
      }
    } catch (error) {
      console.error("Trade error:", error);
      toast.error("Trade failed");
    } finally {
      setIsTrading(false);
    }
  };

  // Sell percentage of position
  const sellPercentage = async (tokenMint: string, balance: number, percent: number) => {
    const sellAmount = balance * (percent / 100);
    await executeQuickTrade("sell", tokenMint, sellAmount);
  };

  // Toggle strategy active state
  const toggleStrategy = async (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;
    setIsUpdatingStrategy(true);
    try {
      const res = await fetch(`/api/strategies/${strategyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !strategy.isActive }),
      });
      if (res.ok) {
        // Update both strategies list and selected strategy
        setStrategies(prev => prev.map(s => 
          s.id === strategyId ? { ...s, isActive: !s.isActive } : s
        ));
        if (selectedStrategy?.id === strategyId) {
          setSelectedStrategy(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        }
        toast.success(strategy.isActive ? "Strategy paused" : "Strategy resumed");
      } else {
        toast.error("Failed to update strategy");
      }
    } catch (error) {
      console.error("Failed to toggle strategy:", error);
      toast.error("Failed to update strategy");
    } finally {
      setIsUpdatingStrategy(false);
    }
  };

  // Delete strategy
  const deleteStrategy = async (strategyId: string) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;
    setIsUpdatingStrategy(true);
    try {
      const res = await fetch(`/api/strategies/${strategyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStrategies(prev => prev.filter(s => s.id !== strategyId));
        if (selectedStrategy?.id === strategyId) {
          setSelectedStrategy(null);
          setShowMonitor(false);
        }
        toast.success("Strategy deleted");
      } else {
        toast.error("Failed to delete strategy");
      }
    } catch (error) {
      console.error("Failed to delete strategy:", error);
      toast.error("Failed to delete strategy");
    } finally {
      setIsUpdatingStrategy(false);
    }
  };

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch("/api/data/trending");
        if (res.ok) {
          const data = await res.json();
          
          // Hot tokens come pre-sorted by price change from API
          const hotTokens = (data.hotTokens || []).slice(0, 10).map((t: any) => ({
            symbol: t.symbol,
            name: t.name,
            address: t.address,
            logoURI: t.logoURI,
            price: t.price || 0,
            priceChange24h: t.priceChange24h || 0,
            volume24h: t.volume24h || 0,
            liquidity: t.liquidity || 0,
            marketCap: t.marketCap || 0,
          }));

          // Volume tokens come pre-sorted by volume from API
          const highVolume = (data.volumeTokens || []).slice(0, 10).map((t: any) => ({
            symbol: t.symbol,
            name: t.name,
            address: t.address,
            logoURI: t.logoURI,
            price: t.price || 0,
            priceChange24h: t.priceChange24h || 0,
            volume24h: t.volume24h || 0,
            liquidity: t.liquidity || 0,
            marketCap: t.marketCap || 0,
          }));

          // New pairs from new listings
          const newPairs = (data.newLaunches || []).slice(0, 10).map((t: any) => ({
            symbol: t.symbol,
            name: t.name,
            address: t.mint || t.address,
            logoURI: t.logoURI,
            price: t.price || 0,
            priceChange24h: t.priceChange24h || 0,
            volume24h: t.volume24h || 0,
            liquidity: t.liquidity || 0,
            marketCap: t.marketCap || 0,
            listedAt: t.listedAt,
          }));

          setMarketData({
            hotTokens,
            newPairs,
            highVolume,
          });
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch market data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
    // Auto-refresh every 60 seconds (1 minute)
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const copyAddress = () => {
    if (walletData?.publicKey) {
      navigator.clipboard.writeText(walletData.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatNumber = (num: number) => {
    if (!num) return "$0";
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (!price) return "$0";
    if (price < 0.00000001) return `$${price.toExponential(1)}`;
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getCurrentTokens = (): TokenData[] => {
    switch (marketSection) {
      case "hot":
        return marketData.hotTokens;
      case "new":
        return marketData.newPairs;
      case "volume":
        return marketData.highVolume;
      default:
        return [];
    }
  };

  const renderTokenCard = (token: TokenData, index: number) => (
    <motion.a
      key={token.address || index}
      href={`https://birdeye.so/token/${token.address}?chain=solana`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="block bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
    >
      <div className="flex items-center gap-3">
        {/* Token Logo */}
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="w-9 h-9 rounded-full bg-white/10 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-pink/50 to-accent-blue/50 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {token.symbol?.charAt(0) || "?"}
          </div>
        )}

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-sm truncate max-w-[80px]">
                {token.symbol}
              </span>
              <ExternalLink size={10} className="text-white/30 flex-shrink-0" />
            </div>
            {token.priceChange24h !== undefined && token.priceChange24h !== 0 && (
              <span
                className={`text-xs font-bold ${
                  token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {token.priceChange24h >= 0 ? "+" : ""}
                {token.priceChange24h.toFixed(1)}%
              </span>
            )}
            {marketSection === "new" && token.listedAt && (
              <span className="text-xs text-accent-pink">
                {formatTimeAgo(token.listedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/60 text-xs truncate max-w-[100px]">
              {token.name}
            </span>
            <span className="text-white text-xs font-medium">
              {formatPrice(token.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-white/40">
            MC: <span className="text-white/70 font-medium">{token.marketCap ? formatNumber(token.marketCap) : "—"}</span>
          </span>
          <span className="text-white/20">•</span>
          <span className="text-white/40">
            Vol: <span className="text-white/60">{token.volume24h ? formatNumber(token.volume24h) : "—"}</span>
          </span>
        </div>
        <span className="text-white/40">
          Liq: <span className="text-white/60">{token.liquidity ? formatNumber(token.liquidity) : "—"}</span>
        </span>
      </div>
    </motion.a>
  );

  return (
    <div className="h-full flex flex-col bg-white/[0.02] border-l border-white/10">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: "market", label: "market" },
          { id: "positions", label: "positions" },
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
      <div className="flex-1 overflow-y-auto terminal-scroll">
        {/* Market Tab */}
        {activeTab === "market" && (
          <div className="flex flex-col h-full">
            {/* Market Section Tabs */}
            <div className="flex gap-1 p-3 border-b border-white/5">
              <button
                onClick={() => setMarketSection("hot")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  marketSection === "hot"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-white/5 text-white/40 hover:text-white/60"
                }`}
              >
                <Flame size={12} />
                hot
              </button>
              <button
                onClick={() => setMarketSection("new")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  marketSection === "new"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/5 text-white/40 hover:text-white/60"
                }`}
              >
                <Clock size={12} />
                new pairs
              </button>
              <button
                onClick={() => setMarketSection("volume")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  marketSection === "volume"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-white/5 text-white/40 hover:text-white/60"
                }`}
              >
                <TrendingUp size={12} />
                volume
              </button>
            </div>

            {/* Section Header */}
            <div className="px-4 py-2 flex items-center justify-between">
              <h3 className="text-white/50 text-xs font-medium">
                {marketSection === "hot" && "🔥 pumping & dumping"}
                {marketSection === "new" && "🆕 just launched"}
                {marketSection === "volume" && "📊 high volume"}
              </h3>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-white/20 text-[10px]">
                    {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <button
                  onClick={() => {
                    setIsLoading(true);
                    fetch("/api/data/trending")
                      .then(res => res.json())
                      .then(data => {
                        const hotTokens = (data.hotTokens || []).slice(0, 10).map((t: any) => ({
                          symbol: t.symbol,
                          name: t.name,
                          address: t.address,
                          logoURI: t.logoURI,
                          price: t.price || 0,
                          priceChange24h: t.priceChange24h || 0,
                          volume24h: t.volume24h || 0,
                          liquidity: t.liquidity || 0,
                          marketCap: t.marketCap || 0,
                        }));
                        const highVolume = (data.volumeTokens || []).slice(0, 10).map((t: any) => ({
                          symbol: t.symbol,
                          name: t.name,
                          address: t.address,
                          logoURI: t.logoURI,
                          price: t.price || 0,
                          priceChange24h: t.priceChange24h || 0,
                          volume24h: t.volume24h || 0,
                          liquidity: t.liquidity || 0,
                          marketCap: t.marketCap || 0,
                        }));
                        const newPairs = (data.newLaunches || []).slice(0, 10).map((t: any) => ({
                          symbol: t.symbol,
                          name: t.name,
                          address: t.mint || t.address,
                          logoURI: t.logoURI,
                          price: t.price || 0,
                          priceChange24h: t.priceChange24h || 0,
                          volume24h: t.volume24h || 0,
                          liquidity: t.liquidity || 0,
                          marketCap: t.marketCap || 0,
                          listedAt: t.listedAt,
                        }));
                        setMarketData({ hotTokens, newPairs, highVolume });
                        setLastUpdated(new Date());
                      })
                      .catch(console.error)
                      .finally(() => setIsLoading(false));
                  }}
                  className="text-white/30 hover:text-white/60 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-xl p-4 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10" />
                        <div className="flex-1">
                          <div className="h-4 bg-white/10 rounded w-20 mb-2" />
                          <div className="h-3 bg-white/10 rounded w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : getCurrentTokens().length > 0 ? (
                getCurrentTokens().map((token, i) => renderTokenCard(token, i))
              ) : (
                <div className="text-center py-12 text-white/40">
                  <Zap size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">no tokens found</p>
                  <p className="text-xs mt-1">check back soon</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="p-4 space-y-4">
            {isWalletLoading ? (
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
                        <div className="w-32 h-32 bg-ink/10 flex items-center justify-center text-ink/40 text-xs">
                          QR Code
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Balance */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">
                      balance
                    </h3>
                    <button
                      onClick={fetchWalletBalance}
                      disabled={isWalletBalanceLoading}
                      className="text-white/40 hover:text-white transition-colors"
                      title="Refresh balance"
                    >
                      <RefreshCw size={14} className={isWalletBalanceLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-2xl font-bold">
                      {(freshSolBalance ?? walletData?.solBalance ?? 0).toFixed(4)}
                    </span>
                    <span className="text-white/60">SOL</span>
                  </div>
                  <p className="text-white/40 text-sm mt-1">
                    ≈ ${((freshSolBalance ?? walletData?.solBalance ?? 0) * (solPrice || 200)).toFixed(2)} USD
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
                    href="https://jup.ag/swap/SOL-USDC"
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

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div className="flex flex-col h-full">
            {/* Header with refresh */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-white font-bold text-sm">portfolio</h3>
                {positionsData && (
                  <p className="text-accent-pink font-bold text-lg">
                    {formatNumber(positionsData.totalValue)}
                  </p>
                )}
              </div>
              <button
                onClick={fetchPositions}
                disabled={isPositionsLoading}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={`text-white/60 ${isPositionsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Positions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isPositionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="flex-1">
                          <div className="h-4 bg-white/10 rounded w-20 mb-2" />
                          <div className="h-3 bg-white/10 rounded w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : positionsData && positionsData.positions.length > 0 ? (
                positionsData.positions.map((pos, i) => (
                  <motion.div
                    key={pos.mint}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Token Logo */}
                      {pos.logoURI ? (
                        <img
                          src={pos.logoURI}
                          alt={pos.symbol}
                          className="w-10 h-10 rounded-full bg-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-pink/50 to-accent-blue/50 flex items-center justify-center text-white text-sm font-bold">
                          {pos.symbol?.charAt(0) || "?"}
                        </div>
                      )}

                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{pos.symbol}</span>
                          <span className="text-white font-bold">
                            {formatNumber(pos.value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white/50 text-xs">
                            {pos.balance.toFixed(pos.symbol === "SOL" ? 4 : 2)} {pos.symbol}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              pos.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {pos.priceChange24h >= 0 ? "+" : ""}
                            {pos.priceChange24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Trade Controls */}
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-white/40">
                          Price: <span className="text-white/60">{formatPrice(pos.price)}</span>
                        </span>
                        <button
                          onClick={() => setTradingPosition(tradingPosition === pos.mint ? null : pos.mint)}
                          className="text-accent-pink hover:text-accent-pink/80 font-medium"
                        >
                          {tradingPosition === pos.mint ? "close" : "trade"}
                        </button>
                      </div>

                      {/* Expanded Trade Controls */}
                      <AnimatePresence>
                        {tradingPosition === pos.mint && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-2">
                              {/* Quick Sell Percentages */}
                              {pos.symbol !== "SOL" && (
                                <div className="flex gap-1">
                                  {[25, 50, 75, 100].map((pct) => (
                                    <button
                                      key={pct}
                                      onClick={() => sellPercentage(pos.mint, pos.balance, pct)}
                                      disabled={isTrading}
                                      className="flex-1 py-1.5 text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {pct === 100 ? "sell all" : `${pct}%`}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Custom Amount */}
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={tradeAmount}
                                  onChange={(e) => setTradeAmount(e.target.value)}
                                  placeholder={pos.symbol === "SOL" ? "SOL amount to buy" : "Amount to sell"}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-accent-pink/50"
                                />
                                {pos.symbol === "SOL" ? (
                                  <button
                                    onClick={() => {
                                      const amt = parseFloat(tradeAmount);
                                      if (amt > 0) {
                                        // For SOL, we'd need a token selector - for now show toast
                                        toast.info("Use chat to buy tokens: 'buy 0.1 SOL of BONK'");
                                      }
                                    }}
                                    disabled={isTrading || !tradeAmount}
                                    className="px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                  >
                                    <ShoppingCart size={14} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const amt = parseFloat(tradeAmount);
                                      if (amt > 0) executeQuickTrade("sell", pos.mint, amt);
                                    }}
                                    disabled={isTrading || !tradeAmount}
                                    className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                  >
                                    <DollarSign size={14} />
                                  </button>
                                )}
                              </div>

                              {/* External Links */}
                              <div className="flex gap-2 text-xs">
                                <a
                                  href={`https://birdeye.so/token/${pos.mint}?chain=solana`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 text-center bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  chart
                                </a>
                                <a
                                  href={`https://solscan.io/token/${pos.mint}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 text-center bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  explorer
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-white/40">
                  <PieChart size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">no positions yet</p>
                  <p className="text-xs mt-1">deposit SOL to start trading</p>
                </div>
              )}
            </div>

            {/* Quick Trade Tip */}
            <div className="p-3 border-t border-white/10">
              <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-xl p-3 text-center">
                <p className="text-accent-blue text-xs">
                  tip: use chat to buy tokens - &quot;buy 0.1 SOL of BONK&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === "strategy" && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-white font-bold text-sm">my strategies</h3>
                <p className="text-white/40 text-xs">
                  {strategies.filter(s => s.isActive).length} active / {strategies.length} total
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentStep === "describe" ? "bg-accent-pink animate-pulse" : "bg-green-400"}`} />
                <span className="text-white/40 text-xs">{currentStep}</span>
              </div>
            </div>

            {/* Strategies List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isStrategyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-white/10 rounded w-full mb-2" />
                      <div className="h-3 bg-white/10 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : strategies.length > 0 ? (
                strategies.map((strategy, index) => (
                  <motion.button
                    key={strategy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedStrategy(strategy);
                      setShowMonitor(true);
                    }}
                    className="w-full bg-white/5 rounded-xl p-3 border border-white/10 hover:border-accent-pink/50 hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className={strategy.isActive ? "text-green-400 animate-pulse" : "text-white/40"} />
                        <h3 className="text-white font-bold text-sm lowercase truncate max-w-[150px]">{strategy.name}</h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        strategy.isActive 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-white/10 text-white/60"
                      }`}>
                        {strategy.isActive ? "active" : "paused"}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs line-clamp-1 mb-2">{strategy.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/30">
                        {strategy.config?.type || "—"} • {strategy.config?.amount || 0} SOL
                      </span>
                      <span className="text-white/30 group-hover:text-accent-pink transition-colors">
                        monitor →
                      </span>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity size={32} className="mx-auto mb-3 text-white/20" />
                  <p className="text-white/40 text-sm mb-2">no strategies yet</p>
                  <p className="text-white/30 text-xs">describe what you want to trade in the chat</p>
                </div>
              )}
            </div>

            {/* Help Text */}
            {strategies.length === 0 && (
              <div className="p-3 border-t border-white/10">
                <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-xl p-3">
                  <p className="text-accent-blue text-xs">
                    tip: tell the AI what you want to trade. example: &quot;snipe new pairs under 15min, min 10k liquidity, 0.01 SOL&quot;
                  </p>
                </div>
              </div>
            )}
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

      {/* Strategy Monitor Modal */}
      <AnimatePresence>
        {showMonitor && selectedStrategy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMonitor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedStrategy.isActive 
                      ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                      : "bg-white/10"
                  }`}>
                    <Activity size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg lowercase">
                      monitor
                    </h2>
                    <p className="text-white/40 text-sm">
                      {selectedStrategy.isActive ? "strategy running" : "strategy paused"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMonitor(false)}
                  className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content - Two Column Layout */}
              <div className="flex h-[50vh]">
                {/* Left: Config & Info */}
                <div className="w-1/2 p-4 overflow-y-auto border-r border-white/10 space-y-4">
                  {/* Strategy Info */}
                  <div>
                    <h3 className="text-white font-bold text-lg lowercase mb-1">
                      {selectedStrategy.name}
                    </h3>
                    <p className="text-white/50 text-xs line-clamp-2">
                      {selectedStrategy.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      selectedStrategy.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/10 text-white/60"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedStrategy.isActive
                          ? "bg-green-400 animate-pulse"
                          : "bg-white/40"
                      }`} />
                      {selectedStrategy.isActive ? "Running" : "Paused"}
                    </span>
                  </div>

                  {/* Configuration */}
                  <div className="bg-white/5 rounded-xl p-3 space-y-2">
                    <h4 className="text-white/60 text-xs uppercase tracking-wider mb-2">
                      Config
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/40">Type</span>
                        <p className="text-white font-medium">{selectedStrategy.config?.type || "—"}</p>
                      </div>
                      {selectedStrategy.config?.amount && (
                        <div>
                          <span className="text-white/40">Amount</span>
                          <p className="text-white font-medium">{selectedStrategy.config.amount} SOL</p>
                        </div>
                      )}
                      {selectedStrategy.config?.maxAgeMinutes && (
                        <div>
                          <span className="text-white/40">Max Age</span>
                          <p className="text-white font-medium">{selectedStrategy.config.maxAgeMinutes} min</p>
                        </div>
                      )}
                      {selectedStrategy.config?.minLiquidity && (
                        <div>
                          <span className="text-white/40">Min Liq</span>
                          <p className="text-white font-medium">${(selectedStrategy.config.minLiquidity / 1000).toFixed(0)}k</p>
                        </div>
                      )}
                      {selectedStrategy.config?.minMarketCap && (
                        <div>
                          <span className="text-white/40">Min MC</span>
                          <p className="text-white font-medium">${(selectedStrategy.config.minMarketCap / 1000).toFixed(0)}k</p>
                        </div>
                      )}
                      {selectedStrategy.config?.stopLoss && (
                        <div>
                          <span className="text-white/40">Stop Loss</span>
                          <p className="text-red-400 font-medium">-{selectedStrategy.config.stopLoss}%</p>
                        </div>
                      )}
                      {selectedStrategy.config?.takeProfit && (
                        <div>
                          <span className="text-white/40">Take Profit</span>
                          <p className="text-green-400 font-medium">+{selectedStrategy.config.takeProfit}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-white/20 text-[10px] text-center">
                    ID: {selectedStrategy.id.slice(0, 16)}...
                  </p>
                </div>

                {/* Right: Live Activity Log */}
                <div className="w-1/2 flex flex-col">
                  <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio size={14} className={selectedStrategy.isActive ? "text-green-400 animate-pulse" : "text-white/40"} />
                      <span className="text-white/60 text-xs font-bold uppercase">live activity</span>
                    </div>
                    <button
                      onClick={() => fetchActivityLog(selectedStrategy.id)}
                      disabled={isActivityLoading}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      <RefreshCw size={12} className={isActivityLoading ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isActivityLoading && activityLog.length === 0 ? (
                      <div className="space-y-2 p-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-2 animate-pulse">
                            <div className="h-3 bg-white/10 rounded w-3/4" />
                          </div>
                        ))}
                      </div>
                    ) : activityLog.length > 0 ? (
                      activityLog.map((log) => (
                        <div
                          key={log.id}
                          className={`rounded-lg p-2 text-xs ${
                            log.type === "buy" ? "bg-green-500/10 border-l-2 border-green-500" :
                            log.type === "sell" ? "bg-red-500/10 border-l-2 border-red-500" :
                            log.type === "scan" ? "bg-blue-500/10 border-l-2 border-blue-500" :
                            log.type === "error" ? "bg-orange-500/10 border-l-2 border-orange-500" :
                            "bg-white/5 border-l-2 border-white/20"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              {log.type === "buy" && <ArrowUpRight size={12} className="text-green-400" />}
                              {log.type === "sell" && <ArrowDownRight size={12} className="text-red-400" />}
                              {log.type === "scan" && <Search size={12} className="text-blue-400" />}
                              {log.type === "error" && <AlertCircle size={12} className="text-orange-400" />}
                              {log.type === "info" && <Activity size={12} className="text-white/40" />}
                              {log.type === "check" && <Clock size={12} className="text-white/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/80 truncate">{log.message}</p>
                              <p className="text-white/30 text-[10px]">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            {log.details?.signature && (
                              <a
                                href={`https://solscan.io/tx/${log.details.signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-pink hover:text-accent-pink/80"
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs">
                        <Radio size={24} className="mb-2 opacity-30" />
                        <p>no activity yet</p>
                        <p className="text-[10px]">waiting for opportunities...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
                <button
                  onClick={() => toggleStrategy(selectedStrategy.id)}
                  disabled={isUpdatingStrategy}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 ${
                    selectedStrategy.isActive
                      ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                      : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  }`}
                >
                  {selectedStrategy.isActive ? (
                    <>
                      <Pause size={18} />
                      pause
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      resume
                    </>
                  )}
                </button>
                <button
                  onClick={() => deleteStrategy(selectedStrategy.id)}
                  disabled={isUpdatingStrategy}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
