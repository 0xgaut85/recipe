"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, TrendingUp, Layers } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Strategies",
    desc: "Deploy in seconds, not days. No API wiring required.",
    size: "col-span-1 md:col-span-2",
  },
  {
    icon: Layers,
    title: "Pre-wired Connectors",
    desc: "Integrated with Jupiter, DexScreener, Pump.fun, and more.",
    size: "col-span-1",
  },
  {
    icon: TrendingUp,
    title: "Strategy Marketplace",
    desc: "Share strategies. Earn from forks and subscriptions.",
    size: "col-span-1",
  },
  {
    icon: Shield,
    title: "Safety First",
    desc: "Risk limits, slippage protection, and simulation before live.",
    size: "col-span-1 md:col-span-2",
  },
];

const smoothEase = [0.22, 1, 0.36, 1];

export const Features: FC = () => {
  return (
    <section className="py-24 relative bg-ink">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: smoothEase }}
          className="mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-white/60">
            Batteries included. Ready to trade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: i * 0.08,
                duration: 0.6,
                ease: smoothEase,
              }}
              className={`${feature.size} tech-card p-8 flex flex-col justify-between group cursor-default`}
            >
              <div className="w-10 h-10 rounded-lg bg-claude-orange/10 flex items-center justify-center mb-4 group-hover:bg-claude-orange/20 transition-colors">
                <feature.icon className="w-5 h-5 text-claude-orange" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
