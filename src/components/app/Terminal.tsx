"use client";

import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { User, Trophy, ArrowDownToLine, RefreshCw } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { ChatPanel } from "./ChatPanel";
import { DataPanel } from "./DataPanel";
import { ProfileModal } from "./ProfileModal";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { WithdrawModal } from "./WithdrawModal";
import type { CookingStep } from "@/app/app/page";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

          {/* Wallet Address */}
          {walletData && (
            <div className="hidden md:flex items-center gap-2 text-white/40 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span>
                {walletData.publicKey.slice(0, 4)}...
                {walletData.publicKey.slice(-4)}
              </span>
            </div>
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
    </div>
  );
};
