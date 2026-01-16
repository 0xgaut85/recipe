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
          className="h-screen w-screen bg-black flex items-center justify-center relative overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-pink/10 rounded-full blur-[150px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, -8, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px]"
            />
          </div>

          {/* Noise Overlay */}
          <div className="absolute inset-0 bg-noise opacity-5" />

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
                  src="/logo.jpg"
                  alt="recipe.money"
                  width={80}
                  height={80}
                  className="rounded-2xl border-2 border-white/20"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border-2 border-dashed border-white/10 rounded-3xl"
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-display text-4xl md:text-5xl font-bold text-white mb-4 lowercase"
            >
              time to cook.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white/60 text-lg mb-10 font-medium lowercase"
            >
              connect your wallet to enter the kitchen
            </motion.p>

            {/* Connect Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="wallet-dark"
            >
              <WalletMultiButtonDynamic />
            </motion.div>

            {/* Security Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 text-white/30 text-xs lowercase"
            >
              your keys, your crypto. we never store private keys.
            </motion.p>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-8 left-8 text-white/20 font-mono text-xs">
            recipe.money/app
          </div>
          <div className="absolute bottom-8 right-8 text-white/20 font-mono text-xs">
            v0.1.0
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
