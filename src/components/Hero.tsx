"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import { GlassCard, CuisineTicket } from "@/components/ui";

export const Hero: FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-white">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 8, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-pink/8 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-blue/8 rounded-full blur-[120px]"
        />
      </div>

      <div className="container-wide relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard
              variant="light"
              className="inline-block px-4 py-2 rounded-full mb-6"
            >
              <span className="text-sm font-bold text-ink tracking-wide lowercase">
                the vibetrading platform
              </span>
            </GlassCard>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold text-ink leading-[0.9] tracking-tight mb-8"
          >
            time to
            <br />
            <span className="relative inline-block">
              cook.
              <motion.svg
                viewBox="0 0 100 20"
                className="absolute -bottom-4 left-0 w-full h-auto text-accent-pink -z-10 opacity-60"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
              >
                <motion.path
                  d="M0 10 Q50 20 100 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                />
              </motion.svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl text-ink-light font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed lowercase"
          >
            if you can describe it, you can run it.
            <br />
            iterate fast enough to matter.
          </motion.p>
        </div>

        {/* Right Visual - Cuisine Tickets */}
        <div
          className="relative h-[600px] w-full hidden lg:flex items-center justify-center"
          style={{ perspective: "1200px" }}
        >
          {/* Ticket 1 - The Old Way */}
          <CuisineTicket
            variant="light"
            delay={0.4}
            floatDirection="up"
            className="absolute top-16 right-8 w-72"
          >
            <div className="text-center mb-1">
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-[0.2em]">
                order #001
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-ink mb-4 lowercase text-center">
              the old way
            </p>
            <div className="space-y-2 text-ink-light font-medium text-sm lowercase">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ink/30 rounded-full" />
                write glue code
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ink/30 rounded-full" />
                normalize data
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ink/30 rounded-full" />
                debug api limits
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ink/30 rounded-full" />
                maybe trade?
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-ink/20 text-center">
              <span className="text-xs font-mono text-ink/40">
                ≈ days to weeks
              </span>
            </div>
          </CuisineTicket>

          {/* Ticket 2 - The Recipe Way */}
          <CuisineTicket
            variant="accent"
            delay={0.6}
            floatDirection="down"
            className="absolute top-52 left-4 w-72 z-10"
          >
            <div className="text-center mb-1">
              <span className="text-[10px] font-bold text-ink/60 uppercase tracking-[0.2em]">
                order #002
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-ink mb-4 lowercase text-center">
              the recipe way
            </p>
            <div className="space-y-2 text-ink font-bold text-base lowercase">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-ink rounded-full" />
                describe intent
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-ink rounded-full" />
                claude cooks
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-ink rounded-full" />
                deploy to solana
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-ink/30 text-center">
              <span className="text-sm font-mono font-bold text-ink">
                ≈ minutes
              </span>
            </div>
          </CuisineTicket>
        </div>
      </div>
    </section>
  );
};
