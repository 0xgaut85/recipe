"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, TrendingUp, Layers } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "[Instant]",
    desc: "Deploy in seconds, not days. No API wiring required. Just describe what you want.",
    size: "col-span-1 md:col-span-2",
  },
  {
    icon: Layers,
    title: "[Connectors]",
    desc: "Pre-wired to Jupiter, DexScreener, Pump.fun, Birdeye and more.",
    size: "col-span-1",
  },
  {
    icon: TrendingUp,
    title: "[Marketplace]",
    desc: "Share strategies. Earn from forks and subscriptions.",
    size: "col-span-1",
  },
  {
    icon: Shield,
    title: "[Safety]",
    desc: "Built-in risk limits, slippage protection and simulation mode before going live.",
    size: "col-span-1 md:col-span-2",
  },
];

const smoothEase = [0.22, 1, 0.36, 1];

export const Features: FC = () => {
  return (
    <section
      className="relative"
      style={{ backgroundColor: "#F7F7F7", paddingTop: "80px", paddingBottom: "80px" }}
    >
      <div className="px-4 sm:px-6 md:px-10 lg:px-[40px]" style={{ maxWidth: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: smoothEase }}
          className="mb-12"
        >
          <h2
            className="text-black text-3xl sm:text-4xl md:text-[46.45px] leading-tight md:leading-[51.095px] mb-4"
            style={{
              fontWeight: 400,
              fontFamily: "TWKEverett-Regular, sans-serif",
              letterSpacing: "-1.858px",
              color: "rgb(0, 0, 0)",
            }}
          >
            Everything You Need
          </h2>
          <p
            className="text-lg"
            style={{
              fontWeight: 400,
              fontFamily: "BaselGrotesk-Regular, sans-serif",
              color: "rgb(0, 0, 0)",
            }}
          >
            Batteries included. Ready to trade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
              className={`${feature.size} border border-gray-200 hover:border-[#E57B3A] transition-all duration-300 card-hover p-6 sm:p-8 flex flex-col justify-between group cursor-default`}
              style={{ borderRadius: "0px", minHeight: "200px" }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-[#E57B3A]/20 transition-colors"
                style={{
                  backgroundColor: "rgba(255, 77, 0, 0.1)",
                  clipPath:
                    "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                }}
              >
                <feature.icon className="w-5 h-5" style={{ color: "#E57B3A" }} />
              </div>
              <div>
                <h3
                  className="text-black text-xl sm:text-2xl md:text-[24px] mb-2"
                  style={{
                    fontWeight: 400,
                    fontFamily: "TWKEverettMono-Regular, monospace",
                    lineHeight: "1.4",
                    letterSpacing: "-0.96px",
                    color: "rgb(0, 0, 0)",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="leading-relaxed"
                  style={{
                    fontWeight: 400,
                    fontFamily: "BaselGrotesk-Regular, sans-serif",
                    lineHeight: "1.4",
                    color: "rgb(0, 0, 0)",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
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
