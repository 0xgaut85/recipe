"use client";

import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { CookingStep } from "@/app/app/page";

const stepLabels: Record<CookingStep, string> = {
  describe: "describing...",
  cook: "cooking...",
  taste: "tasting...",
  serve: "serving...",
};

const stepEmojis: Record<CookingStep, string> = {
  describe: "01",
  cook: "02",
  taste: "03",
  serve: "04",
};

interface LoadingOverlayProps {
  isVisible: boolean;
  step: CookingStep;
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
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        >
          {/* Background Animation */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-pink/20 rounded-full blur-[200px]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Rotating Logo */}
            <div className="relative mb-8">
              {/* Outer Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-6 border-2 border-dashed border-white/20 rounded-full"
              />
              
              {/* Inner Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-3 border-2 border-white/10 rounded-full"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-accent-pink rounded-full" />
              </motion.div>

              {/* Logo */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/logo.jpg"
                  alt="recipe.money"
                  width={64}
                  height={64}
                  className="rounded-xl border-2 border-white/20"
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
              step {stepEmojis[step]}
            </motion.div>

            {/* Step Label */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-display text-3xl font-bold text-white lowercase"
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
                  className="w-2 h-2 bg-accent-blue rounded-full"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
