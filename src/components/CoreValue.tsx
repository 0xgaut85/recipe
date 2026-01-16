"use client";

import { FC } from "react";
import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Describe", desc: "Tell Claude what you want to trade" },
  { num: "02", title: "Configure", desc: "Set your parameters and limits" },
  { num: "03", title: "Review", desc: "Verify the strategy before launch" },
  { num: "04", title: "Deploy", desc: "Execute live on Solana" },
];

const smoothEase = [0.22, 1, 0.36, 1];

export const CoreValue: FC = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-ink">
      <div className="container-wide">
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: smoothEase }}
            className="col-span-1 lg:col-span-8"
          >
            <div className="h-full glass-card p-10 md:p-12 flex flex-col justify-center">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium uppercase tracking-wider mb-6 w-fit">
                The Insight
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-[1.15]">
                Alpha isn&apos;t scarce.
                <br />
                <span className="text-white/40">Execution speed is.</span>
              </h2>
            </div>
          </motion.div>

          {/* Accent Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: smoothEase }}
            className="col-span-1 lg:col-span-4"
          >
            <div className="h-full accent-card p-8 flex flex-col justify-center">
              <h3 className="font-display text-2xl font-semibold text-white mb-3">
                Seconds, Not Days
              </h3>
              <p className="text-white/70 font-normal leading-relaxed">
                Go from idea to live execution before the opportunity vanishes.
              </p>
            </div>
          </motion.div>

          {/* Process Steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.25, ease: smoothEase }}
            className="col-span-1 lg:col-span-12"
          >
            <div className="glass-panel p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + i * 0.1,
                      ease: smoothEase,
                    }}
                    className="p-5 md:p-6 rounded-lg border border-white/5 bg-white/[0.02] hover:border-claude-orange/30 transition-colors cursor-default group"
                  >
                    <div className="mb-3">
                      <span className="text-xs font-mono text-claude-orange font-medium">
                        {step.num}
                      </span>
                    </div>
                    <h4 className="font-display text-lg font-semibold text-white mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-white/50">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
