"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export const Hero: FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-ink">
      {/* Subtle orange gradient glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-claude-orange/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-claude-orange/5 rounded-full blur-[180px]" />
      </div>

      <div className="container-wide relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-claude-orange animate-pulse" />
            Powered by Claude AI
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[1.05] tracking-tight mb-6"
        >
          Trade with
          <br />
          <span className="relative inline-block">
            Intelligence
            <svg
              viewBox="0 0 200 8"
              className="absolute -bottom-2 left-0 w-full h-auto"
              preserveAspectRatio="none"
            >
              <path
                d="M0 4 Q50 8 100 4 T200 4"
                fill="none"
                stroke="#E57B3A"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg md:text-xl text-white/60 font-normal max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Describe your trading strategy in natural language. Claude executes it on Solana in seconds, not days.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/app"
            className="px-8 py-4 rounded-lg bg-claude-orange text-white font-semibold text-base hover:bg-claude-orange/90 transition-all duration-200 min-w-[180px]"
          >
            Launch App
          </Link>
          <Link
            href="/docs"
            className="px-8 py-4 rounded-lg bg-transparent border border-white/20 text-white font-semibold text-base hover:bg-white/5 transition-all duration-200 min-w-[180px]"
          >
            Read Docs
          </Link>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 pt-10 border-t border-white/10"
        >
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-white">10s</div>
              <div className="text-sm text-white/50 mt-1">Strategy Deploy</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-white/50 mt-1">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-claude-orange">AI</div>
              <div className="text-sm text-white/50 mt-1">Powered</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
