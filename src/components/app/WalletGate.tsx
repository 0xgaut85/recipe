"use client";

import { FC, ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface WalletGateProps {
  children: ReactNode;
}

export const WalletGate: FC<WalletGateProps> = ({ children }) => {
  const { connected } = useWallet();

  return (
    <AnimatePresence mode="wait">
      {connected ? (
        <motion.div
          key="terminal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="connect"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-screen w-screen bg-white flex items-center justify-center relative overflow-hidden"
        >
          {/* Grid background */}
          <div className="absolute inset-0 bg-grid" />
          
          {/* Subtle gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-claude-orange/20 rounded-full blur-[150px]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-md px-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 flex justify-center"
            >
              <div className="relative">
                <Image
                  src="/claude.png"
                  alt="Claude Trade"
                  width={72}
                  height={72}
                  className="rounded-2xl"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border border-ink/10 rounded-3xl"
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-display text-3xl md:text-4xl font-semibold text-ink mb-4"
            >
              Connect to Trade
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-ink/50 text-lg mb-10 font-normal"
            >
              Connect your wallet to start trading with AI
            </motion.p>

            {/* Connect Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <WalletMultiButtonDynamic />
            </motion.div>

            {/* Security Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 text-ink/30 text-xs"
            >
              Your keys, your crypto. We never store private keys.
            </motion.p>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-8 left-8 text-ink/20 font-mono text-xs">
            CLAUDE TRADE
          </div>
          <div className="absolute bottom-8 right-8 text-ink/20 font-mono text-xs">
            v1.0.0
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
