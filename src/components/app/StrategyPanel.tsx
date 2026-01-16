"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle,
  Plus,
  ChevronRight,
  BarChart3,
} from "lucide-react";

interface StrategyConfig {
  type: "SPOT" | "PERP" | "SNIPER";
  token?: string;
  inputToken?: string;
  outputToken?: string;
  amount?: number;
  leverage?: number;
  direction?: string;
  conditions?: Array<{ type: string; value: any }>;
  stopLoss?: number;
  takeProfit?: number;
  // SNIPER specific
  maxAgeMinutes?: number;
  minLiquidity?: number;
  maxLiquidity?: number;
  minVolume?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  slippageBps?: number;
  nameFilter?: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  config: StrategyConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalPnl: number;
    totalTrades: number;
    winRate: number;
  };
}

interface StrategyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyPanel: FC<StrategyPanelProps> = ({ isOpen, onClose }) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStrategies();
    }
  }, [isOpen]);

  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/strategies");
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies || []);
      }
    } catch (error) {
      console.error("Failed to fetch strategies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStrategy = async (strategy: Strategy) => {
    try {
      setIsUpdating(strategy.id);
      const res = await fetch(`/api/strategies/${strategy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !strategy.isActive }),
      });

      if (res.ok) {
        setStrategies((prev) =>
          prev.map((s) =>
            s.id === strategy.id ? { ...s, isActive: !s.isActive } : s
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle strategy:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteStrategy = async (id: string) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      setIsUpdating(id);
      const res = await fetch(`/api/strategies/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStrategies((prev) => prev.filter((s) => s.id !== id));
        if (selectedStrategy?.id === id) {
          setSelectedStrategy(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete strategy:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const formatPnl = (pnl: number) => {
    const isPositive = pnl >= 0;
    return (
      <span className={isPositive ? "text-green-400" : "text-red-400"}>
        {isPositive ? "+" : ""}${pnl.toFixed(2)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-pink to-accent-blue flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg lowercase">
                  my strategies
                </h2>
                <p className="text-white/40 text-sm">
                  {strategies.filter((s) => s.isActive).length} active
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(80vh-80px)]">
            {/* Strategy List */}
            <div className="w-1/2 border-r border-white/10 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-xl p-4 animate-pulse"
                    >
                      <div className="h-5 bg-white/10 rounded w-2/3 mb-3" />
                      <div className="h-4 bg-white/10 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : strategies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-white/30" />
                  </div>
                  <h3 className="text-white font-bold mb-2 lowercase">
                    no strategies yet
                  </h3>
                  <p className="text-white/40 text-sm mb-4 max-w-xs">
                    create your first strategy by chatting with the AI. describe
                    what you want to trade and it will help you set it up.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-accent-pink text-black font-bold rounded-lg text-sm hover:bg-accent-pink/80 transition-colors lowercase"
                  >
                    <Plus size={16} className="inline mr-1" />
                    create strategy
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {strategies.map((strategy) => (
                    <motion.div
                      key={strategy.id}
                      layout
                      className={`rounded-xl p-4 cursor-pointer transition-all ${
                        selectedStrategy?.id === strategy.id
                          ? "bg-white/10 border border-accent-pink/50"
                          : "bg-white/5 border border-transparent hover:bg-white/10"
                      }`}
                      onClick={() => setSelectedStrategy(strategy)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              strategy.isActive
                                ? "bg-green-400 animate-pulse"
                                : "bg-white/30"
                            }`}
                          />
                          <h3 className="text-white font-bold lowercase">
                            {strategy.name}
                          </h3>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            strategy.config.type === "SPOT"
                              ? "bg-blue-500/20 text-blue-400"
                              : strategy.config.type === "SNIPER"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {strategy.config.type}
                        </span>
                      </div>

                      <p className="text-white/50 text-sm line-clamp-2 mb-3">
                        {strategy.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-white/40">
                            {strategy.stats?.totalTrades || 0} trades
                          </span>
                          {strategy.stats && formatPnl(strategy.stats.totalPnl)}
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-white/30"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Strategy Details */}
            <div className="w-1/2 overflow-y-auto">
              {selectedStrategy ? (
                <div className="p-6">
                  {/* Strategy Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-white font-bold text-xl lowercase mb-1">
                        {selectedStrategy.name}
                      </h3>
                      <p className="text-white/40 text-sm">
                        Created {formatDate(selectedStrategy.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStrategy(selectedStrategy)}
                        disabled={isUpdating === selectedStrategy.id}
                        className={`p-2.5 rounded-lg transition-colors ${
                          selectedStrategy.isActive
                            ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        } disabled:opacity-50`}
                        title={selectedStrategy.isActive ? "Stop" : "Start"}
                      >
                        {selectedStrategy.isActive ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteStrategy(selectedStrategy.id)}
                        disabled={isUpdating === selectedStrategy.id}
                        className="p-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-6">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                        selectedStrategy.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          selectedStrategy.isActive
                            ? "bg-green-400 animate-pulse"
                            : "bg-white/40"
                        }`}
                      />
                      {selectedStrategy.isActive ? "Running" : "Stopped"}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h4 className="text-white/60 text-xs uppercase tracking-wider mb-2">
                      Description
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {selectedStrategy.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {(selectedStrategy.stats?.totalPnl || 0) >= 0 ? (
                          <TrendingUp size={16} className="text-green-400" />
                        ) : (
                          <TrendingDown size={16} className="text-red-400" />
                        )}
                        <span className="text-white/40 text-xs uppercase">
                          Total PnL
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg">
                        {selectedStrategy.stats
                          ? formatPnl(selectedStrategy.stats.totalPnl)
                          : "$0.00"}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-accent-blue" />
                        <span className="text-white/40 text-xs uppercase">
                          Win Rate
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg">
                        {selectedStrategy.stats?.winRate.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-accent-pink" />
                        <span className="text-white/40 text-xs uppercase">
                          Trades
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg">
                        {selectedStrategy.stats?.totalTrades || 0}
                      </p>
                    </div>
                  </div>

                  {/* Config Details */}
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">
                      Configuration
                    </h4>
                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/40 text-sm">Type</span>
                        <span className="text-white text-sm font-medium">
                          {selectedStrategy.config.type}
                        </span>
                      </div>
                      {selectedStrategy.config.inputToken && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Input</span>
                          <span className="text-white text-sm font-mono">
                            {selectedStrategy.config.inputToken.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.outputToken && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Output</span>
                          <span className="text-white text-sm font-mono">
                            {selectedStrategy.config.outputToken.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.amount && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Amount</span>
                          <span className="text-white text-sm">
                            {selectedStrategy.config.amount}
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.leverage && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Leverage</span>
                          <span className="text-white text-sm">
                            {selectedStrategy.config.leverage}x
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.stopLoss && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Stop Loss</span>
                          <span className="text-red-400 text-sm">
                            -{selectedStrategy.config.stopLoss}%
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.takeProfit && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">
                            Take Profit
                          </span>
                          <span className="text-green-400 text-sm">
                            +{selectedStrategy.config.takeProfit}%
                          </span>
                        </div>
                      )}
                      {/* SNIPER specific fields */}
                      {selectedStrategy.config.maxAgeMinutes && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Max Age</span>
                          <span className="text-white text-sm">
                            {selectedStrategy.config.maxAgeMinutes} min
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.minLiquidity && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Min Liquidity</span>
                          <span className="text-white text-sm">
                            ${selectedStrategy.config.minLiquidity.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.minVolume && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Min Volume</span>
                          <span className="text-white text-sm">
                            ${selectedStrategy.config.minVolume.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.nameFilter && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Name Filter</span>
                          <span className="text-white text-sm">
                            &quot;{selectedStrategy.config.nameFilter}&quot;
                          </span>
                        </div>
                      )}
                      {selectedStrategy.config.slippageBps && (
                        <div className="flex justify-between">
                          <span className="text-white/40 text-sm">Slippage</span>
                          <span className="text-white text-sm">
                            {(selectedStrategy.config.slippageBps / 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <BarChart3 size={48} className="text-white/20 mb-4" />
                  <p className="text-white/40 text-sm">
                    Select a strategy to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
