"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { User, Trophy, ArrowDownToLine, RefreshCw, BarChart3, LogOut, Copy, Check, ExternalLink, X } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { StepIndicator } from "./StepIndicator";
import { ChatPanel } from "./ChatPanel";
import { DataPanel } from "./DataPanel";
import { ProfileModal } from "./ProfileModal";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { WithdrawModal } from "./WithdrawModal";
import { StrategyPanel } from "./StrategyPanel";
import type { TradingStep } from "@/app/app/page";
import { toast } from "sonner";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

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

interface TerminalProps {
  currentStep: TradingStep;
  onStepChange: (step: TradingStep) => void;
}


export const Terminal: FC<TerminalProps> = ({ currentStep, onStepChange }) => {
  const { disconnect, publicKey } = useWallet();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [activeStrategies, setActiveStrategies] = useState(0);
  const [lastTradeNotification, setLastTradeNotification] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      authenticateWallet(publicKey.toBase58());
    }
  }, [publicKey]);

  useEffect(() => {
    if (!walletData) return;

    const checkAndExecute = async () => {
      try {
        const response = await fetch("/api/strategies/execute");
        if (response.ok) {
          const data = await response.json();
          
          const newCount = data.status?.activeCount || 0;
          if (newCount !== activeStrategies) {
            setActiveStrategies(newCount);
          }
          
          if (data.executed && data.results) {
            for (const result of data.results) {
              if (result.action === "TRADE_EXECUTED" && result.trade) {
                const tradeKey = result.trade.signature;
                if (tradeKey !== lastTradeNotification) {
                  toast.success(
                    `Bought ${result.trade.tokenSymbol} for ${result.trade.inputAmount} SOL`,
                    { duration: 5000 }
                  );
                  setLastTradeNotification(tradeKey);
                }
              }
            }
          }
          
          if (data.status?.activeCount > 0) {
            console.log("Strategy poll:", data.message, data.results?.length || 0, "results");
          }
        }
      } catch (error) {
        console.error("Strategy polling error:", error);
      }
    };

    checkAndExecute();
    const pollInterval = setInterval(checkAndExecute, 10000);
    return () => clearInterval(pollInterval);
  }, [walletData, lastTradeNotification, activeStrategies]);

  const authenticateWallet = async (connectedWallet: string) => {
    try {
      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectedWallet }),
      });
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        console.error("Failed to authenticate wallet");
      }
    } catch (error) {
      console.error("Failed to authenticate wallet:", error);
    }
  };

  const refreshBalance = async () => {
    if (!publicKey) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectedWallet: publicKey.toBase58() }),
      });
      if (response.ok) {
        const data = await response.json();
        setWalletData((prev) =>
          prev ? { ...prev, solBalance: data.solBalance } : null
        );
      }
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    } finally {
      setIsRefreshing(false);
    }
  };


  const copyAddress = () => {
    if (walletData?.publicKey) {
      navigator.clipboard.writeText(walletData.publicKey);
      setAddressCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    try {
      document.cookie = "claude_trade_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      await disconnect();
      toast.success("Disconnected successfully");
      setWalletData(null);
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10"
        style={{ backgroundColor: "#000000" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Image
            src="/transparentlogo.png"
            alt="Claude Trade"
            width={28}
            height={28}
            style={{ borderRadius: 0 }}
          />
          <span
            className="text-white text-base sm:text-lg group-hover:text-white/70 transition-colors"
            style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
          >
            CLAUDE TRADE
          </span>
        </Link>

        {/* Step Indicator - Desktop */}
        <div className="hidden lg:block">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Balance Display */}
          {walletData && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-white/20"
              style={{ borderRadius: 0 }}
            >
              <span
                className="text-white text-sm"
                style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
              >
                {walletData.solBalance.toFixed(4)} SOL
              </span>
              <button
                onClick={refreshBalance}
                disabled={isRefreshing}
                className="text-white/40 hover:text-white transition-colors"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsStrategyOpen(true)}
              className="p-2 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              title="My Strategies"
              style={{ borderRadius: 0 }}
            >
              <BarChart3 size={18} />
            </button>
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="p-2 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              title="Withdraw"
              style={{ borderRadius: 0 }}
            >
              <ArrowDownToLine size={18} />
            </button>
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="p-2 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              title="Leaderboard"
              style={{ borderRadius: 0 }}
            >
              <Trophy size={18} />
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-2 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              title="Profile"
              style={{ borderRadius: 0 }}
            >
              <User size={18} />
            </button>
          </div>

          {/* Wallet Address - Clickable */}
          {walletData && (
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="hidden md:flex items-center gap-2 text-white/40 hover:text-white/60 text-xs px-2 py-1 hover:bg-white/10 transition-colors"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace", borderRadius: 0 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>
                {walletData.publicKey.slice(0, 4)}...
                {walletData.publicKey.slice(-4)}
              </span>
            </button>
          )}
        </div>
      </motion.header>

      {/* Mobile Step Indicator */}
      <div
        className="lg:hidden px-4 py-2 border-b border-white/10 overflow-x-auto"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Mobile Balance */}
      {walletData && (
        <div
          className="sm:hidden px-4 py-2 border-b border-white/10 flex items-center justify-between"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          <span
            className="text-white/50 text-sm"
            style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
          >
            Balance
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-white text-sm"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              {walletData.solBalance.toFixed(4)} SOL
            </span>
            <button
              onClick={refreshBalance}
              disabled={isRefreshing}
              className="text-white/40 hover:text-white transition-colors"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: "#0A0A0A" }}>
        {/* Chat Panel - Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-w-0"
        >
          <ChatPanel
            currentStep={currentStep}
            onProgressUpdate={onStepChange}
          />
        </motion.div>

        {/* Data Panel - Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block w-[480px]"
        >
          <DataPanel currentStep={currentStep} walletData={walletData} />
        </motion.div>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialData={walletData?.profile}
        onUpdate={(data) =>
          setWalletData((prev) => (prev ? { ...prev, profile: data } : null))
        }
      />

      <LeaderboardPanel
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={refreshBalance}
      />

      <StrategyPanel
        isOpen={isStrategyOpen}
        onClose={() => setIsStrategyOpen(false)}
      />

      {/* Wallet Modal */}
      <AnimatePresence>
        {isWalletModalOpen && walletData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsWalletModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/10 p-6 w-full max-w-sm"
              style={{ borderRadius: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl text-white"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  WALLET
                </h2>
                <button
                  onClick={() => setIsWalletModalOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Connected Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span
                  className="text-green-400 text-sm"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  Connected
                </span>
              </div>

              {/* Address */}
              <div
                className="bg-white/5 p-4 mb-4 border border-white/10"
                style={{ borderRadius: 0 }}
              >
                <p
                  className="text-white/50 text-xs mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  Address
                </p>
                <p
                  className="text-white text-sm break-all"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  {walletData.publicKey}
                </p>
              </div>

              {/* Balance */}
              <div
                className="bg-white/5 p-4 mb-6 border border-white/10"
                style={{ borderRadius: 0 }}
              >
                <p
                  className="text-white/50 text-xs mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  Balance
                </p>
                <p
                  className="text-white text-2xl"
                  style={{ fontFamily: "TWKEverett-Regular, sans-serif" }}
                >
                  {walletData.solBalance.toFixed(4)}{" "}
                  <span className="text-white/50 text-lg">SOL</span>
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
                  style={{ borderRadius: 0, fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  {addressCopied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{addressCopied ? "COPIED!" : "COPY ADDRESS"}</span>
                </button>

                <a
                  href={`https://solscan.io/account/${walletData.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
                  style={{ borderRadius: 0, fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  <ExternalLink size={18} />
                  <span>VIEW ON SOLSCAN</span>
                </a>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                  style={{ borderRadius: 0, fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  <LogOut size={18} />
                  <span>DISCONNECT</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
