"use client";

import { FC, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import TextScramble from "./TextScramble";
import MagneticButton from "./MagneticButton";

export const Hero: FC = () => {
  const glowRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const scrambleTexts = [
    "Market cognition.",
    "Natural language.",
    "Real-time execution.",
    "Emergent behavior.",
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#000000",
        position: "relative",
        zIndex: 0,
        paddingTop: "100px",
      }}
    >
      {/* Animated background glow */}
      <motion.div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 77, 0, 0.2) 0%, transparent 70%)",
          filter: "blur(60px)",
          zIndex: 1,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div
        className="w-full px-4 sm:px-6 md:px-10 lg:px-[40px] pb-20 sm:pb-16 pt-24 sm:pt-32 relative z-10"
        style={{ maxWidth: "none" }}
      >
        <div
          className="hero-content max-w-full sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]"
          style={{
            textAlign: "start",
            width: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white text-lg sm:text-xl md:text-[22px] mb-4 sm:mb-6"
            style={{
              fontWeight: 400,
              fontFamily: "TWKEverettMono-Regular, monospace",
              color: "rgb(255, 255, 255)",
            }}
          >
            An Experiment in AI Trading
          </motion.p>

          {/* Scramble Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white text-lg sm:text-xl md:text-[22px] mb-6 sm:mb-8"
            style={{
              fontWeight: 400,
              fontFamily: "TWKEverettMono-Regular, monospace",
              lineHeight: "1.3",
              letterSpacing: "-0.88px",
              color: "rgb(255, 255, 255)",
            }}
          >
            <TextScramble texts={scrambleTexts} />
          </motion.p>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white text-3xl sm:text-4xl md:text-[46.45px] leading-tight md:leading-[51.095px] mb-8 sm:mb-12"
            style={{
              fontWeight: 400,
              fontFamily: "TWKEverett-Regular, sans-serif",
              letterSpacing: "-1.858px",
              color: "rgb(255, 255, 255)",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            Give Claude tools to interact with markets.
            <br />
            Watch what happens.
          </motion.h1>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row"
            style={{ marginBottom: "0px", marginTop: "0px", gap: "16px" }}
          >
            <MagneticButton
              href="/app"
              className="text-sm md:text-[14px] font-normal hover:opacity-90 transition-all duration-300 button-hover text-center sm:text-left w-full sm:w-auto"
              style={{
                fontFamily: "TWKEverettMono-Regular, monospace",
                color: "#000000",
                backgroundColor: "#E57B3A",
                padding: "16px 24px",
                textTransform: "uppercase",
                letterSpacing: "-0.56px",
                border: "none",
                borderRadius: "0px",
                textDecoration: "none",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(255, 77, 0, 0.3)",
                clipPath:
                  "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                margin: "0",
              }}
            >
              Launch App
            </MagneticButton>
            <MagneticButton
              href="/docs"
              className="text-sm md:text-[14px] font-normal hover:bg-white/10 transition-all duration-300 text-center sm:text-left w-full sm:w-auto"
              style={{
                fontFamily: "TWKEverettMono-Regular, monospace",
                color: "#FFFFFF",
                backgroundColor: "transparent",
                padding: "16px 24px",
                textTransform: "uppercase",
                letterSpacing: "-0.56px",
                border: "2px solid #FFFFFF",
                borderRadius: "0px",
                textDecoration: "none",
                cursor: "pointer",
                margin: "0",
              }}
            >
              Read Docs
            </MagneticButton>
          </motion.div>

          {/* Enter Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white text-2xl sm:text-3xl md:text-[40px] leading-tight md:leading-[56px]"
            style={{
              fontWeight: 400,
              fontFamily: "TWKEverettMono-Regular, monospace",
              color: "rgb(255, 255, 255)",
              marginTop: "12px",
              marginBottom: "60px",
            }}
          >
            [<TextScramble texts={["ENTER"]} speed={40} />]
          </motion.p>
        </div>
      </div>

      {/* Stats Row at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute bottom-10 left-0 right-0 px-4 sm:px-6 md:px-10 lg:px-[40px]"
      >
        <div className="border-t border-white/10 pt-8">
          <div className="grid grid-cols-3 gap-8 max-w-lg">
            <div>
              <div
                className="text-2xl sm:text-3xl text-white"
                style={{ fontFamily: "TWKEverett-Regular, sans-serif" }}
              >
                10s
              </div>
              <div
                className="text-xs sm:text-sm text-white/50 mt-1"
                style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
              >
                Strategy Deploy
              </div>
            </div>
            <div>
              <div
                className="text-2xl sm:text-3xl text-white"
                style={{ fontFamily: "TWKEverett-Regular, sans-serif" }}
              >
                24/7
              </div>
              <div
                className="text-xs sm:text-sm text-white/50 mt-1"
                style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
              >
                Monitoring
              </div>
            </div>
            <div>
              <div
                className="text-2xl sm:text-3xl"
                style={{
                  fontFamily: "TWKEverett-Regular, sans-serif",
                  color: "#E57B3A",
                }}
              >
                AI
              </div>
              <div
                className="text-xs sm:text-sm text-white/50 mt-1"
                style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
              >
                Powered
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
