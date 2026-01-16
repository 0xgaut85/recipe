"use client";

import { FC, ReactNode } from "react";
import { motion } from "framer-motion";

interface InfoCardProps {
  children: ReactNode;
  variant?: "light" | "accent";
  className?: string;
  delay?: number;
}

// Renamed from CuisineTicket to InfoCard - a clean tech-style info card
export const CuisineTicket: FC<InfoCardProps> = ({
  children,
  variant = "light",
  className = "",
  delay = 0,
}) => {
  const isAccent = variant === "accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`relative ${className}`}
    >
      <div
        className={`rounded-xl p-6 border transition-all ${
          isAccent 
            ? "bg-claude-orange/5 border-claude-orange/20 text-ink" 
            : "bg-white border-ink/10 text-ink"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
};

// Export alias for backwards compatibility
export const InfoCard = CuisineTicket;
