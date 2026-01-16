"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, QrCode, ExternalLink, Flame, Zap, Clock, TrendingUp, PieChart, RefreshCw, Play, Pause, Trash2, X, Activity, Radio, ArrowUpRight, ArrowDownRight, Search, AlertCircle, ShoppingCart, DollarSign } from "lucide-react";
import type { TradingStep } from "@/app/app/page";
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
  currentStep: TradingStep;
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
  const [freshSolBalance, setFreshSolBalance] = useState<number | null>(null);
  const [isWalletBalanceLoading, setIsWalletBalanceLoading] = useState(false);
  const [activityLog, setActivityLog] = useState<Array<{
    id: string;
    type: "scan" | "check" | "buy" | "sell" | "error" | "info";
    message: string;
    timestamp: string;
    details?: { token?: string; amount?: number; price?: number; signature?: string };
  }>>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [tradingPosition, setTradingPosition] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [isTrading, setIsTrading] = useState(false);

  useEffect(() => {
    if (walletData !== undefined) {
      setIsWalletLoading(false);
    }
  }, [walletData]);

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
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
        setSolPrice(200);
      }
    };

    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, []);

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
      const interval = setInterval(fetchPositions, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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
      const interval = setInterval(fetchStrategies, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, currentStep]);

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
      const interval = setInterval(fetchWalletBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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

  useEffect(() => {
    if (showMonitor && selectedStrategy) {
      fetchActivityLog(selectedStrategy.id);
      const interval = setInterval(() => fetchActivityLog(selectedStrategy.id), 5000);
      return () => clearInterval(interval);
    }
  }, [showMonitor, selectedStrategy]);

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

  const sellPercentage = async (tokenMint: string, balance: number, percent: number) => {
    const sellAmount = balance * (percent / 100);
    await executeQuickTrade("sell", tokenMint, sellAmount);
  };

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

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch("/api/data/trending");
        if (res.ok) {
          const data = await res.json();
          
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
      className="block bg-white rounded-lg p-3 hover:bg-ink/5 transition-all border border-ink/5 hover:border-ink/10"
    >
      <div className="flex items-center gap-3">
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="w-9 h-9 rounded-full bg-ink/5 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-claude-orange/10 flex items-center justify-center text-claude-orange text-xs font-bold flex-shrink-0">
            {token.symbol?.charAt(0) || "?"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-ink font-semibold text-sm truncate max-w-[80px]">
                {token.symbol}
              </span>
              <ExternalLink size={10} className="text-ink/30 flex-shrink-0" />
            </div>
            {token.priceChange24h !== undefined && token.priceChange24h !== 0 && (
              <span
                className={`text-xs font-semibold ${
                  token.priceChange24h >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {token.priceChange24h >= 0 ? "+" : ""}
                {token.priceChange24h.toFixed(1)}%
              </span>
            )}
            {marketSection === "new" && token.listedAt && (
              <span className="text-xs text-claude-orange">
                {formatTimeAgo(token.listedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-ink/50 text-xs truncate max-w-[100px]">
              {token.name}
            </span>
            <span className="text-ink text-xs font-medium">
              {formatPrice(token.price)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink/5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink/40">
            MC: <span className="text-ink/60 font-medium">{token.marketCap ? formatNumber(token.marketCap) : "—"}</span>
          </span>
          <span className="text-ink/20">•</span>
          <span className="text-ink/40">
            Vol: <span className="text-ink/60">{token.volume24h ? formatNumber(token.volume24h) : "—"}</span>
          </span>
        </div>
        <span className="text-ink/40">
          Liq: <span className="text-ink/60">{token.liquidity ? formatNumber(token.liquidity) : "—"}</span>
        </span>
      </div>
    </motion.a>
  );

  return (
    <div className="h-full flex flex-col bg-white border-l border-ink/10">
      {/* Tabs */}
      <div className="flex border-b border-ink/10">
        {[
          { id: "market", label: "Market" },
          { id: "positions", label: "Positions" },
          { id: "wallet", label: "Wallet" },
          { id: "strategy", label: "Strategy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-claude-orange border-b-2 border-claude-orange"
                : "text-ink/40 hover:text-ink/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Market Tab */}
        {activeTab === "market" && (
          <div className="flex flex-col h-full">
            <div className="flex gap-1 p-3 border-b border-ink/5">
              <button
                onClick={() => setMarketSection("hot")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  marketSection === "hot"
                    ? "bg-claude-orange/10 text-claude-orange"
                    : "bg-ink/5 text-ink/40 hover:text-ink/60"
                }`}
              >
                <Flame size={12} />
                Hot
              </button>
              <button
                onClick={() => setMarketSection("new")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  marketSection === "new"
                    ? "bg-claude-orange/10 text-claude-orange"
                    : "bg-ink/5 text-ink/40 hover:text-ink/60"
                }`}
              >
                <Clock size={12} />
                New Pairs
              </button>
              <button
                onClick={() => setMarketSection("volume")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  marketSection === "volume"
                    ? "bg-claude-orange/10 text-claude-orange"
                    : "bg-ink/5 text-ink/40 hover:text-ink/60"
                }`}
              >
                <TrendingUp size={12} />
                Volume
              </button>
            </div>

            <div className="px-4 py-2 flex items-center justify-between">
              <h3 className="text-ink/50 text-xs font-medium flex items-center gap-1.5">
                {marketSection === "hot" && <><Flame size={12} className="text-claude-orange" /> Trending</>}
                {marketSection === "new" && <><Zap size={12} className="text-claude-orange" /> Just Launched</>}
                {marketSection === "volume" && <><TrendingUp size={12} className="text-claude-orange" /> High Volume</>}
              </h3>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-ink/20 text-[10px]">
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
                          symbol: t.symbol, name: t.name, address: t.address, logoURI: t.logoURI,
                          price: t.price || 0, priceChange24h: t.priceChange24h || 0,
                          volume24h: t.volume24h || 0, liquidity: t.liquidity || 0, marketCap: t.marketCap || 0,
                        }));
                        const highVolume = (data.volumeTokens || []).slice(0, 10).map((t: any) => ({
                          symbol: t.symbol, name: t.name, address: t.address, logoURI: t.logoURI,
                          price: t.price || 0, priceChange24h: t.priceChange24h || 0,
                          volume24h: t.volume24h || 0, liquidity: t.liquidity || 0, marketCap: t.marketCap || 0,
                        }));
                        const newPairs = (data.newLaunches || []).slice(0, 10).map((t: any) => ({
                          symbol: t.symbol, name: t.name, address: t.mint || t.address, logoURI: t.logoURI,
                          price: t.price || 0, priceChange24h: t.priceChange24h || 0,
                          volume24h: t.volume24h || 0, liquidity: t.liquidity || 0, marketCap: t.marketCap || 0, listedAt: t.listedAt,
                        }));
                        setMarketData({ hotTokens, newPairs, highVolume });
                        setLastUpdated(new Date());
                      })
                      .catch(console.error)
                      .finally(() => setIsLoading(false));
                  }}
                  className="text-ink/30 hover:text-ink/60 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-ink/5 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-ink/10" />
                        <div className="flex-1">
                          <div className="h-4 bg-ink/10 rounded w-20 mb-2" />
                          <div className="h-3 bg-ink/10 rounded w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : getCurrentTokens().length > 0 ? (
                getCurrentTokens().map((token, i) => renderTokenCard(token, i))
              ) : (
                <div className="text-center py-12 text-ink/40">
                  <Zap size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No tokens found</p>
                  <p className="text-xs mt-1">Check back soon</p>
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
                <div className="bg-ink/5 rounded-lg p-4">
                  <div className="h-4 bg-ink/10 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-ink/10 rounded w-full mb-2" />
                </div>
                <div className="bg-ink/5 rounded-lg p-4">
                  <div className="h-4 bg-ink/10 rounded w-1/4 mb-3" />
                  <div className="h-8 bg-ink/10 rounded w-1/2" />
                </div>
              </div>
            ) : (
              <>
                <div className="bg-ink/5 rounded-lg p-4 border border-ink/5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                      Deposit Address
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowQR(!showQR)}
                        className="text-ink/40 hover:text-ink transition-colors"
                        title="Show QR Code"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        onClick={copyAddress}
                        className="text-ink/40 hover:text-ink transition-colors"
                        title="Copy Address"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-ink/80 text-xs font-mono break-all">
                    {walletData?.publicKey || "No wallet"}
                  </p>
                </div>

                <div className="bg-ink/5 rounded-lg p-4 border border-ink/5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-ink/60 text-xs font-medium uppercase tracking-wider">
                      Balance
                    </h3>
                    <button
                      onClick={fetchWalletBalance}
                      disabled={isWalletBalanceLoading}
                      className="text-ink/40 hover:text-ink transition-colors"
                      title="Refresh balance"
                    >
                      <RefreshCw size={14} className={isWalletBalanceLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-ink text-2xl font-semibold">
                      {(freshSolBalance ?? walletData?.solBalance ?? 0).toFixed(4)}
                    </span>
                    <span className="text-ink/50">SOL</span>
                  </div>
                  <p className="text-ink/40 text-sm mt-1">
                    ≈ ${((freshSolBalance ?? walletData?.solBalance ?? 0) * (solPrice || 200)).toFixed(2)} USD
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://solscan.io/account/${walletData?.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-ink/5 rounded-lg p-3 text-center hover:bg-ink/10 transition-colors"
                  >
                    <span className="text-ink/60 text-sm">View on Solscan</span>
                  </a>
                  <a
                    href="https://jup.ag/swap/SOL-USDC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-ink/5 rounded-lg p-3 text-center hover:bg-ink/10 transition-colors"
                  >
                    <span className="text-ink/60 text-sm">Buy SOL</span>
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 flex items-center justify-between border-b border-ink/5">
              <div>
                <h3 className="text-ink font-semibold text-sm">Portfolio</h3>
                {positionsData && (
                  <p className="text-claude-orange font-semibold text-lg">
                    {formatNumber(positionsData.totalValue)}
                  </p>
                )}
              </div>
              <button
                onClick={fetchPositions}
                disabled={isPositionsLoading}
                className="p-2 rounded-lg bg-ink/5 hover:bg-ink/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={`text-ink/60 ${isPositionsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isPositionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-ink/5 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-ink/10" />
                        <div className="flex-1">
                          <div className="h-4 bg-ink/10 rounded w-20 mb-2" />
                          <div className="h-3 bg-ink/10 rounded w-32" />
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
                    className="bg-white rounded-lg p-3 border border-ink/5 hover:border-ink/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {pos.logoURI ? (
                        <img src={pos.logoURI} alt={pos.symbol} className="w-10 h-10 rounded-full bg-ink/5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-claude-orange/10 flex items-center justify-center text-claude-orange text-sm font-bold">
                          {pos.symbol?.charAt(0) || "?"}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-ink font-semibold">{pos.symbol}</span>
                          <span className="text-ink font-semibold">{formatNumber(pos.value)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-ink/50 text-xs">
                            {pos.balance.toFixed(pos.symbol === "SOL" ? 4 : 2)} {pos.symbol}
                          </span>
                          <span className={`text-xs font-medium ${pos.priceChange24h >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {pos.priceChange24h >= 0 ? "+" : ""}{pos.priceChange24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-ink/5">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-ink/40">Price: <span className="text-ink/60">{formatPrice(pos.price)}</span></span>
                        <button
                          onClick={() => setTradingPosition(tradingPosition === pos.mint ? null : pos.mint)}
                          className="text-claude-orange hover:text-claude-orange-dark font-medium"
                        >
                          {tradingPosition === pos.mint ? "Close" : "Trade"}
                        </button>
                      </div>

                      <AnimatePresence>
                        {tradingPosition === pos.mint && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-2 space-y-2">
                              {pos.symbol !== "SOL" && (
                                <div className="flex gap-1">
                                  {[25, 50, 75, 100].map((pct) => (
                                    <button key={pct} onClick={() => sellPercentage(pos.mint, pos.balance, pct)} disabled={isTrading}
                                      className="flex-1 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
                                      {pct === 100 ? "Sell All" : `${pct}%`}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2 text-xs">
                                <a href={`https://birdeye.so/token/${pos.mint}?chain=solana`} target="_blank" rel="noopener noreferrer"
                                  className="flex-1 py-1.5 text-center bg-ink/5 text-ink/60 hover:text-ink hover:bg-ink/10 rounded-lg transition-colors">Chart</a>
                                <a href={`https://solscan.io/token/${pos.mint}`} target="_blank" rel="noopener noreferrer"
                                  className="flex-1 py-1.5 text-center bg-ink/5 text-ink/60 hover:text-ink hover:bg-ink/10 rounded-lg transition-colors">Explorer</a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-ink/40">
                  <PieChart size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No positions yet</p>
                  <p className="text-xs mt-1">Deposit SOL to start trading</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-ink/10">
              <div className="bg-claude-orange/5 border border-claude-orange/20 rounded-lg p-3 text-center">
                <p className="text-claude-orange text-xs">Tip: Use chat to buy tokens - &quot;buy 0.1 SOL of BONK&quot;</p>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === "strategy" && (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 flex items-center justify-between border-b border-ink/5">
              <div>
                <h3 className="text-ink font-semibold text-sm">My Strategies</h3>
                <p className="text-ink/40 text-xs">
                  {strategies.filter(s => s.isActive).length} active / {strategies.length} total
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentStep === "describe" ? "bg-claude-orange animate-pulse" : "bg-green-500"}`} />
                <span className="text-ink/40 text-xs">{currentStep}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isStrategyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-ink/5 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-ink/10 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-ink/10 rounded w-full mb-2" />
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
                    onClick={() => { setSelectedStrategy(strategy); setShowMonitor(true); }}
                    className="w-full bg-white rounded-lg p-3 border border-ink/5 hover:border-claude-orange/30 hover:bg-ink/[0.02] transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className={strategy.isActive ? "text-green-500 animate-pulse" : "text-ink/30"} />
                        <h3 className="text-ink font-semibold text-sm truncate max-w-[150px]">{strategy.name}</h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${strategy.isActive ? "bg-green-50 text-green-600" : "bg-ink/5 text-ink/50"}`}>
                        {strategy.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-ink/50 text-xs line-clamp-1 mb-2">{strategy.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink/30">{strategy.config?.type || "—"} • {strategy.config?.amount || 0} SOL</span>
                      <span className="text-ink/30 group-hover:text-claude-orange transition-colors">Monitor →</span>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity size={32} className="mx-auto mb-3 text-ink/20" />
                  <p className="text-ink/40 text-sm mb-2">No strategies yet</p>
                  <p className="text-ink/30 text-xs">Describe what you want to trade in the chat</p>
                </div>
              )}
            </div>

            {strategies.length === 0 && (
              <div className="p-3 border-t border-ink/10">
                <div className="bg-claude-orange/5 border border-claude-orange/20 rounded-lg p-3">
                  <p className="text-claude-orange text-xs">
                    Tip: Tell the AI what you want to trade. Example: &quot;snipe new pairs under 15min, min 10k liquidity, 0.01 SOL&quot;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-ink/10 p-3 flex items-center justify-between text-xs text-ink/30">
        <span>Solana Mainnet</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Connected</span>
        </div>
      </div>

      {/* Strategy Monitor Modal */}
      <AnimatePresence>
        {showMonitor && selectedStrategy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMonitor(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-ink/10 rounded-xl w-full max-w-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedStrategy.isActive ? "bg-green-50" : "bg-ink/5"}`}>
                    <Activity size={20} className={selectedStrategy.isActive ? "text-green-600" : "text-ink/40"} />
                  </div>
                  <div>
                    <h2 className="text-ink font-semibold text-lg">Monitor</h2>
                    <p className="text-ink/40 text-sm">{selectedStrategy.isActive ? "Strategy running" : "Strategy paused"}</p>
                  </div>
                </div>
                <button onClick={() => setShowMonitor(false)} className="text-ink/40 hover:text-ink transition-colors p-2 hover:bg-ink/5 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="flex h-[60vh]">
                <div className="w-2/5 p-4 overflow-y-auto border-r border-ink/10 space-y-4">
                  <div>
                    <h3 className="text-ink font-semibold text-lg mb-1">{selectedStrategy.name}</h3>
                    <p className="text-ink/50 text-xs line-clamp-2">{selectedStrategy.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${selectedStrategy.isActive ? "bg-green-50 text-green-600" : "bg-ink/5 text-ink/50"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedStrategy.isActive ? "bg-green-500 animate-pulse" : "bg-ink/30"}`} />
                      {selectedStrategy.isActive ? "Running" : "Paused"}
                    </span>
                  </div>

                  <div className="bg-ink/5 rounded-lg p-3 space-y-2">
                    <h4 className="text-ink/60 text-xs uppercase tracking-wider mb-2">Config</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-ink/40">Type</span><p className="text-ink font-medium">{selectedStrategy.config?.type || "—"}</p></div>
                      {selectedStrategy.config?.amount && <div><span className="text-ink/40">Amount</span><p className="text-ink font-medium">{selectedStrategy.config.amount} SOL</p></div>}
                      {selectedStrategy.config?.maxAgeMinutes && <div><span className="text-ink/40">Max Age</span><p className="text-ink font-medium">{selectedStrategy.config.maxAgeMinutes} min</p></div>}
                      {selectedStrategy.config?.minLiquidity && <div><span className="text-ink/40">Min Liq</span><p className="text-ink font-medium">${(selectedStrategy.config.minLiquidity / 1000).toFixed(0)}k</p></div>}
                      {selectedStrategy.config?.stopLoss && <div><span className="text-ink/40">Stop Loss</span><p className="text-red-500 font-medium">-{selectedStrategy.config.stopLoss}%</p></div>}
                      {selectedStrategy.config?.takeProfit && <div><span className="text-ink/40">Take Profit</span><p className="text-green-600 font-medium">+{selectedStrategy.config.takeProfit}%</p></div>}
                    </div>
                  </div>
                </div>

                <div className="w-3/5 flex flex-col">
                  <div className="px-4 py-2 border-b border-ink/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio size={14} className={selectedStrategy.isActive ? "text-green-500 animate-pulse" : "text-ink/40"} />
                      <span className="text-ink/60 text-xs font-medium uppercase">Live Activity</span>
                    </div>
                    <button onClick={() => fetchActivityLog(selectedStrategy.id)} disabled={isActivityLoading} className="text-ink/30 hover:text-ink/60 transition-colors">
                      <RefreshCw size={12} className={isActivityLoading ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isActivityLoading && activityLog.length === 0 ? (
                      <div className="space-y-2 p-2">
                        {[1, 2, 3, 4].map((i) => (<div key={i} className="bg-ink/5 rounded-lg p-2 animate-pulse"><div className="h-3 bg-ink/10 rounded w-3/4" /></div>))}
                      </div>
                    ) : activityLog.length > 0 ? (
                      activityLog.map((log) => (
                        <div key={log.id} className={`rounded-lg p-2 text-xs ${
                          log.type === "buy" ? "bg-green-50 border-l-2 border-green-500" :
                          log.type === "sell" ? "bg-red-50 border-l-2 border-red-500" :
                          log.type === "error" ? "bg-red-50 border-l-2 border-red-400" :
                          "bg-ink/5 border-l-2 border-ink/20"
                        }`}>
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              {log.type === "buy" && <ArrowUpRight size={12} className="text-green-600" />}
                              {log.type === "sell" && <ArrowDownRight size={12} className="text-red-500" />}
                              {log.type === "scan" && <Search size={12} className="text-blue-500" />}
                              {log.type === "error" && <AlertCircle size={12} className="text-red-500" />}
                              {log.type === "info" && <Activity size={12} className="text-ink/40" />}
                              {log.type === "check" && <Clock size={12} className="text-ink/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-ink/80 truncate">{log.message}</p>
                              <p className="text-ink/30 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                            {log.details?.signature && (
                              <a href={`https://solscan.io/tx/${log.details.signature}`} target="_blank" rel="noopener noreferrer" className="text-claude-orange hover:text-claude-orange-dark">
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-ink/30 text-xs">
                        <Radio size={24} className="mb-2 opacity-30" />
                        <p>No activity yet</p>
                        <p className="text-[10px]">Waiting for opportunities...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-ink/10 flex items-center gap-3">
                <button onClick={() => toggleStrategy(selectedStrategy.id)} disabled={isUpdatingStrategy}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    selectedStrategy.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}>
                  {selectedStrategy.isActive ? <><Pause size={18} />Pause</> : <><Play size={18} />Resume</>}
                </button>
                <button onClick={() => deleteStrategy(selectedStrategy.id)} disabled={isUpdatingStrategy}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink transition-colors disabled:opacity-50">
                  <Trash2 size={18} />Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
