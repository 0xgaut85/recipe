"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface WithdrawInfo {
  publicKey: string;
  solBalance: number;
  maxWithdrawable: number;
  minWithdrawal: number;
  networkFee: number;
  platformFee: number;
  totalFee: number;
  withdrawalsToday: number;
  maxDailyWithdrawals: number;
  canWithdraw: boolean;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WithdrawModal: FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [withdrawInfo, setWithdrawInfo] = useState<WithdrawInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWithdrawInfo();
    }
  }, [isOpen]);

  const fetchWithdrawInfo = async () => {
    try {
      const response = await fetch("/api/wallet/withdraw");
      if (response.ok) {
        const data = await response.json();
        setWithdrawInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch withdraw info:", error);
    }
  };

  const validateAddress = (address: string) => {
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  };

  const handleAddressChange = (value: string) => {
    setDestination(value);
    if (value.length >= 32) {
      setIsValidAddress(validateAddress(value));
    } else {
      setIsValidAddress(null);
    }
  };

  const handleMaxClick = () => {
    if (withdrawInfo) {
      setAmount(withdrawInfo.maxWithdrawable.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!withdrawInfo?.canWithdraw) {
      toast.error("Withdrawals not available");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < withdrawInfo.minWithdrawal) {
      toast.error(`Minimum withdrawal is ${withdrawInfo.minWithdrawal} SOL`);
      return;
    }

    if (amountNum > withdrawInfo.maxWithdrawable) {
      toast.error("Insufficient balance");
      return;
    }

    if (!isValidAddress) {
      toast.error("Invalid destination address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          destination,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Withdrawal failed");
      }

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Withdrawal successful!</span>
          <a
            href={data.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E57B3A] hover:underline flex items-center gap-1"
          >
            View on Solscan <ExternalLink size={12} />
          </a>
        </div>
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal failed");
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = () => {
    if (withdrawInfo?.publicKey) {
      navigator.clipboard.writeText(withdrawInfo.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum >= (withdrawInfo?.minWithdrawal || 0) && 
                        amountNum <= (withdrawInfo?.maxWithdrawable || 0);

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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-display text-xl font-semibold text-white">
                Withdraw SOL
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} className="text-white/50" />
              </button>
            </div>

            {/* Content */}
            {withdrawInfo ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Balance Display */}
                <div className="p-4 rounded-lg bg-[#E57B3A]/5 border border-[#E57B3A]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Available Balance</span>
                    <span className="font-display text-xl text-white">
                      {withdrawInfo.solBalance.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-white/40">Max Withdrawable</span>
                    <span className="text-sm text-white/60">
                      {withdrawInfo.maxWithdrawable.toFixed(4)} SOL
                    </span>
                  </div>
                </div>

                {/* Deposit Address */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Your Deposit Address</span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="text-white/50 hover:text-[#E57B3A] transition-colors"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-white/60 font-mono mt-1 break-all">
                    {withdrawInfo.publicKey}
                  </p>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Amount (SOL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.0001"
                      min={withdrawInfo.minWithdrawal}
                      max={withdrawInfo.maxWithdrawable}
                      className="w-full p-3 pr-16 rounded-lg border border-white/10 focus:border-[#E57B3A] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleMaxClick}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-[#E57B3A]/10 text-[#E57B3A] text-sm font-medium hover:bg-[#E57B3A]/20 transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Destination Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Enter Solana wallet address"
                    className={`w-full p-3 rounded-lg border focus:outline-none transition-colors ${
                      isValidAddress === null
                        ? "border-white/10 focus:border-[#E57B3A]"
                        : isValidAddress
                        ? "border-green-500 focus:border-green-500"
                        : "border-red-500 focus:border-red-500"
                    }`}
                  />
                  {isValidAddress === false && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Invalid Solana address
                    </p>
                  )}
                </div>

                {/* Fee Breakdown */}
                <div className="p-4 rounded-lg bg-white/5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Network Fee</span>
                    <span className="text-white">{withdrawInfo.networkFee} SOL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Platform Fee</span>
                    <span className="text-white">{withdrawInfo.platformFee} SOL</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="font-medium text-white">You Receive</span>
                    <span className={`font-medium ${isValidAmount ? "text-green-400" : "text-white"}`}>
                      {amountNum > 0 ? amountNum.toFixed(4) : "0.0000"} SOL
                    </span>
                  </div>
                </div>

                {/* Daily Limit Warning */}
                {withdrawInfo.withdrawalsToday > 0 && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <AlertCircle size={14} />
                    <span>
                      {withdrawInfo.withdrawalsToday}/{withdrawInfo.maxDailyWithdrawals} withdrawals today
                    </span>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !withdrawInfo.canWithdraw || !isValidAddress}
                  className="w-full p-4 rounded-lg bg-[#E57B3A] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#E57B3A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.98 }}
                >
                  <Send size={18} />
                  {isLoading ? "Processing..." : "Confirm Withdrawal"}
                </motion.button>
              </form>
            ) : (
              <div className="p-6 flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E57B3A] border-t-transparent" />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
