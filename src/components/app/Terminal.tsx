"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { User, Trophy, ArrowDownToLine, RefreshCw, BarChart3, LogOut, Copy, Check, ExternalLink, X } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { ChatPanel } from "./ChatPanel";
import { DataPanel } from "./DataPanel";
import { ProfileModal } from "./ProfileModal";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { WithdrawModal } from "./WithdrawModal";
import { StrategyPanel } from "./StrategyPanel";
import type { CookingStep } from "@/app/app/page";
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
  currentStep: CookingStep;
  onStepChange: (step: CookingStep) => void;
}

const nextStep: Record<CookingStep, CookingStep | null> = {
  describe: "cook",
  cook: "taste",
  taste: "serve",
  serve: null,
};

export const Terminal: FC<TerminalProps> = ({ currentStep, onStepChange }) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  // Fetch wallet data on mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/auth/wallet");
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    }
  };

  const refreshBalance = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/auth/wallet", { method: "POST" });
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

  const handleStepComplete = (step: CookingStep) => {
    const next = nextStep[step];
    if (next) {
      onStepChange(next);
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
      // Clear session cookie
      document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      // Stay on app page so user can reconnect with a different wallet
      toast.success("Disconnected! Connect a new wallet to continue.");
      // Force page reload to reset state and show WalletGate
      window.location.reload();
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Image
            src="/logo.jpg"
            alt="recipe.money"
            width={32}
            height={32}
            className="rounded-lg border border-white/20"
          />
          <span className="font-display font-bold text-white text-base sm:text-lg lowercase group-hover:text-white/70 transition-colors">
            recipe
          </span>
          <span className="hidden sm:inline text-white/30 text-sm font-mono">
            /terminal
          </span>
        </Link>

        {/* Step Indicator - Desktop */}
        <div className="hidden lg:block">
          <StepIndicator currentStep={currentStep} onStepClick={onStepChange} />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Balance Display */}
          {walletData && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-white font-mono text-sm">
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
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="My Strategies"
            >
              <BarChart3 size={18} />
            </button>
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="Withdraw"
            >
              <ArrowDownToLine size={18} />
            </button>
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="Leaderboard"
            >
              <Trophy size={18} />
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="Profile"
            >
              <User size={18} />
            </button>
          </div>

          {/* Wallet Address - Clickable */}
          {walletData && (
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="hidden md:flex items-center gap-2 text-white/40 hover:text-white/60 text-xs font-mono px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span>
                {walletData.publicKey.slice(0, 4)}...
                {walletData.publicKey.slice(-4)}
              </span>
            </button>
          )}
        </div>
      </motion.header>

      {/* Mobile Step Indicator */}
      <div className="lg:hidden px-4 py-2 border-b border-white/10 overflow-x-auto">
        <StepIndicator currentStep={currentStep} onStepClick={onStepChange} />
      </div>

      {/* Mobile Balance */}
      {walletData && (
        <div className="sm:hidden px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-white/60 text-sm">balance:</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-sm">
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
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-w-0"
        >
          <ChatPanel
            currentStep={currentStep}
            onStepComplete={handleStepComplete}
          />
        </motion.div>

        {/* Data Panel - Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block w-[400px]"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsWalletModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-ink/90 to-black/90 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white lowercase">wallet</h2>
                <button
                  onClick={() => setIsWalletModalOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Connected Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-sm font-medium">connected</span>
              </div>

              {/* Address */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">address</p>
                <p className="text-white font-mono text-sm break-all">
                  {walletData.publicKey}
                </p>
              </div>

              {/* Balance */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">balance</p>
                <p className="text-white font-bold text-2xl">
                  {walletData.solBalance.toFixed(4)} <span className="text-white/60 text-lg">SOL</span>
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
                >
                  {addressCopied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{addressCopied ? "copied!" : "copy address"}</span>
                </button>

                <a
                  href={`https://solscan.io/account/${walletData.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
                >
                  <ExternalLink size={18} />
                  <span>view on solscan</span>
                </a>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={18} />
                  <span>disconnect wallet</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
