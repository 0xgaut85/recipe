"use client";

import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { TradingStep } from "@/app/app/page";

const stepLabels: Record<TradingStep, string> = {
  describe: "Processing...",
  configure: "Configuring...",
  review: "Reviewing...",
  deploy: "Deploying...",
};

const stepNumbers: Record<TradingStep, string> = {
  describe: "01",
  configure: "02",
  review: "03",
  deploy: "04",
};

interface LoadingOverlayProps {
  isVisible: boolean;
  step: TradingStep;
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({
  isVisible,
  step,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E57B3A]/20 rounded-full blur-[150px]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo with spinner */}
            <div className="relative mb-8">
              {/* Outer Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-6 border border-white/10 rounded-full"
              />
              
              {/* Inner Ring with dot */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-3 border border-white/5 rounded-full"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#E57B3A] rounded-full" />
              </motion.div>

              {/* Logo */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/transparentlogo.png"
                  alt="Claude Trade"
                  width={56}
                  height={56}
                  className="rounded-xl"
                />
              </motion.div>
            </div>

            {/* Step Number */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-mono text-white/40 text-sm mb-2"
            >
              Step {stepNumbers[step]}
            </motion.div>

            {/* Step Label */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-display text-2xl font-semibold text-white"
            >
              {stepLabels[step]}
            </motion.h2>

            {/* Loading Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-2 mt-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  className="w-2 h-2 bg-[#E57B3A] rounded-full"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
