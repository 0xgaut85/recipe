"use client";

import { FC } from "react";
import { motion } from "framer-motion";

const features = [
  {
    title: "instant strategies",
    desc: "ship in minutes, not days. no api wiring required.",
    size: "col-span-1 md:col-span-2",
    bg: "bg-white glass-panel",
    text: "text-ink",
  },
  {
    title: "connectors",
    desc: "pre-wired to axiom, dexscreener, pump.fun.",
    size: "col-span-1",
    bg: "bg-accent-pink bg-noise-pink shadow-[8px_8px_0px_0px_#1A1A1A]",
    text: "text-ink",
  },
  {
    title: "marketplace",
    desc: "monetize access. earn royalties on forks.",
    size: "col-span-1",
    bg: "bg-white glass-panel",
    text: "text-ink",
  },
  {
    title: "safety first",
    desc: "risk limits, slippage protection, simulation.",
    size: "col-span-1 md:col-span-2",
    bg: "bg-black bg-noise border-2 border-ink shadow-[8px_8px_0px_0px_#1A1A1A]",
    text: "text-white",
  },
];

// Smooth easing curve
const smoothEase = [0.22, 1, 0.36, 1];

export const Features: FC = () => {
  return (
    <section className="py-24 relative">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: smoothEase }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-ink mb-4 lowercase">
            everything you need.
          </h2>
          <p className="text-xl text-ink-light lowercase">
            batteries included. chef&apos;s kiss.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
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
              whileHover={{
                y: -6,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className={`${feature.size} ${feature.bg} ${feature.text} rounded-[2rem] p-10 flex flex-col justify-between group overflow-hidden relative cursor-default`}
            >
              <div className="relative z-10 h-full flex flex-col justify-between">
                <h3 className="font-display text-2xl font-bold">
                  {feature.title}
                </h3>
                <p className="font-medium leading-relaxed opacity-90 max-w-[90%]">
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
