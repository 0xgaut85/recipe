"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Activity, X, ExternalLink } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string | null;
  xHandle: string | null;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
}

interface LeaderboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardPanel: FC<LeaderboardPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"pnl" | "trades" | "winRate">("pnl");

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/leaderboard?sortBy=${sortBy}&limit=50`);
          if (response.ok) {
            const data = await response.json();
            setLeaderboard(data.leaderboard);
          }
        } catch (error) {
          console.error("Failed to fetch leaderboard:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, sortBy]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-white/50";
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
    if (rank === 2) return "bg-white/5 border-white/20";
    if (rank === 3) return "bg-amber-500/10 border-amber-500/30";
    return "bg-white/5 border-white/10";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E57B3A]/10 flex items-center justify-center">
                  <Trophy className="text-[#E57B3A]" size={20} />
                </div>
                <h2 className="font-display text-xl font-semibold text-white">
                  Leaderboard
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} className="text-white/50" />
              </button>
            </div>

            {/* Sort Tabs */}
            <div className="flex gap-2 p-4 border-b border-white/10">
              {(["pnl", "trades", "winRate"] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === sort
                      ? "bg-[#E57B3A] text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {sort === "pnl" && "By PnL"}
                  {sort === "trades" && "By Trades"}
                  {sort === "winRate" && "By Win Rate"}
                </button>
              ))}
            </div>

            {/* Leaderboard List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E57B3A] border-t-transparent" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Activity size={48} className="mx-auto mb-4 opacity-40" />
                  <p>No traders on the leaderboard yet</p>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${getRankBg(entry.rank)}`}
                  >
                    {/* Rank */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg ${getRankColor(entry.rank)}`}
                    >
                      {entry.rank <= 3 ? (
                        <Trophy size={20} />
                      ) : (
                        `#${entry.rank}`
                      )}
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.avatar}
                            alt={entry.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#E57B3A]/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-[#E57B3A]">
                              {entry.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-white truncate">
                          {entry.name}
                        </span>
                        {entry.xHandle && (
                          <a
                            href={`https://x.com/${entry.xHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-[#E57B3A] transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div
                          className={`font-medium flex items-center gap-1 ${
                            entry.totalPnl >= 0 ? "text-green-400" : "text-red-500"
                          }`}
                        >
                          {entry.totalPnl >= 0 ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                          ${Math.abs(entry.totalPnl).toLocaleString()}
                        </div>
                        <div className="text-white/40 text-xs">PnL</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {entry.totalTrades}
                        </div>
                        <div className="text-white/40 text-xs">Trades</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {entry.winRate}%
                        </div>
                        <div className="text-white/40 text-xs">Win</div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
