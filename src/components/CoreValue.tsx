"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";

const steps = [
  { num: "01", title: "describe" },
  { num: "02", title: "cook" },
  { num: "03", title: "taste" },
  { num: "04", title: "serve" },
];

// Smooth easing curve
const smoothEase = [0.22, 1, 0.36, 1];

export const CoreValue: FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container-wide">
        {/* Bento Grid */}
        <div className="grid lg:grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)] lg:auto-rows-[300px]">
          {/* Main Statement - Dark Glass with Noise */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: smoothEase }}
            className="col-span-1 lg:col-span-8"
          >
            <GlassCard
              variant="dark"
              className="h-full bg-noise p-12 flex flex-col justify-center relative overflow-hidden group shadow-[8px_8px_0px_0px_#1A1A1A]"
            >
              <div className="relative z-10">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2, ease: smoothEase }}
                  className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold uppercase tracking-wider mb-6 border border-white/10"
                >
                  the insight
                </motion.span>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] lowercase">
                  alpha isn&apos;t scarce.
                  <br />
                  <span className="text-white/40">execution speed is.</span>
                </h2>
              </div>
            </GlassCard>
          </motion.div>

          {/* Narrative Card - Pink Accent */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: smoothEase }}
            className="col-span-1 lg:col-span-4"
          >
            <GlassCard
              variant="pink"
              className="h-full bg-noise-pink p-10 flex flex-col justify-center group overflow-hidden shadow-[8px_8px_0px_0px_#1A1A1A]"
            >
              <h3 className="font-display text-3xl font-bold text-ink mb-4 lowercase">
                minutes, not days.
              </h3>
              <p className="text-ink/80 font-medium text-lg leading-relaxed lowercase">
                go from &quot;i think this will happen&quot; to &quot;this is
                running live&quot; before the opportunity vanishes.
              </p>
            </GlassCard>
          </motion.div>

          {/* Product Loop - Glass Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.25, ease: smoothEase }}
            className="col-span-1 lg:col-span-12"
          >
            <GlassCard
              variant="panel"
              className="p-6 md:p-10 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 md:gap-6 overflow-x-auto"
            >
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
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-[200px] p-6 md:p-8 rounded-[1.5rem] border-2 border-ink bg-white transition-shadow cursor-default hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
                >
                  <div className="mb-4">
                    <span className="text-xs font-bold text-ink/40 tracking-wider">
                      {step.num}
                    </span>
                  </div>
                  <h4 className="font-display text-2xl font-bold text-ink lowercase">
                    {step.title}
                  </h4>
                </motion.div>
              ))}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
