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
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#F7F7F7", paddingTop: "200px", paddingBottom: "80px" }}
    >
      <div className="px-4 sm:px-6 md:px-10 lg:px-[40px]" style={{ maxWidth: "none" }}>
        {/* Main Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: smoothEase }}
        >
          <h2
            className="text-black max-w-5xl text-3xl sm:text-4xl md:text-[46.45px] leading-tight md:leading-[51.095px]"
            style={{
              fontWeight: 400,
              fontFamily: "TWKEverett-Regular, sans-serif",
              letterSpacing: "-1.858px",
              color: "rgb(0, 0, 0)",
              marginBottom: "0px",
              marginTop: "0px",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            Alpha isn&apos;t scarce. Execution speed is. Claude Trade turns
            natural language into live trades in seconds.
          </h2>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: smoothEase }}
          className="max-w-4xl space-y-6 sm:space-y-8 mb-12 sm:mb-16 mt-6 sm:mt-8"
        >
          <p
            className="leading-relaxed text-base sm:text-lg"
            style={{
              fontWeight: 400,
              fontFamily: "BaselGrotesk-Regular, sans-serif",
              lineHeight: "1.4",
              color: "rgb(0, 0, 0)",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            <strong style={{ fontWeight: 600 }}>
              The future isn&apos;t traders with terminals—it&apos;s AI with
              wallets.
            </strong>{" "}
            Describe your strategy in plain English. Claude understands context,
            sets parameters, and executes on Solana&apos;s fastest DEXs.
          </p>
          <p
            className="leading-relaxed text-base sm:text-lg"
            style={{
              fontWeight: 400,
              fontFamily: "BaselGrotesk-Regular, sans-serif",
              lineHeight: "1.4",
              color: "rgb(0, 0, 0)",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            No code. No API wiring. No waiting. Go from idea to live strategy
            before the opportunity closes.
          </p>
        </motion.div>

        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.25, ease: smoothEase }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 list-none"
          style={{ marginTop: "40px" }}
        >
          {steps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.4 + idx * 0.1,
                ease: smoothEase,
              }}
              className="border border-gray-200 hover:border-[#E57B3A] transition-all duration-300 card-hover group"
              style={{
                borderRadius: "0px",
                paddingTop: "24px",
                paddingBottom: "24px",
                paddingLeft: "20px",
                paddingRight: "20px",
              }}
            >
              <span
                className="text-xs font-medium mb-3 block"
                style={{
                  fontFamily: "TWKEverettMono-Regular, monospace",
                  color: "#E57B3A",
                }}
              >
                [{step.num}]
              </span>
              <h3
                className="text-black text-xl sm:text-2xl md:text-[24px] mt-3 sm:mt-4"
                style={{
                  marginBottom: "8px",
                  fontWeight: 400,
                  fontFamily: "TWKEverettMono-Regular, monospace",
                  lineHeight: "1.4",
                  letterSpacing: "-0.96px",
                  color: "rgb(0, 0, 0)",
                }}
              >
                {step.title}
              </h3>
              <p
                className="leading-relaxed text-base mt-2"
                style={{
                  fontWeight: 400,
                  fontFamily: "BaselGrotesk-Regular, sans-serif",
                  lineHeight: "1.4",
                  color: "rgb(0, 0, 0)",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
