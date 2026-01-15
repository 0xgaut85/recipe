"use client";

import { FC, ReactNode } from "react";
import { motion } from "framer-motion";

interface CuisineTicketProps {
  children: ReactNode;
  variant?: "light" | "accent";
  className?: string;
  delay?: number;
  floatDirection?: "up" | "down";
}

export const CuisineTicket: FC<CuisineTicketProps> = ({
  children,
  variant = "light",
  className = "",
  delay = 0,
  floatDirection = "up",
}) => {
  const isAccent = variant === "accent";

  // Subtle floating animation
  const floatY = floatDirection === "up" ? [0, -8, 0] : [0, 8, 0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`relative ${className}`}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        animate={{ y: floatY }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay + 0.5,
        }}
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateY(-5deg) rotateX(5deg)",
        }}
      >
        {/* Ticket Container with curved top */}
        <div
          className={`relative overflow-visible rounded-b-3xl border-2 border-ink shadow-[8px_8px_0px_0px_#1A1A1A] ${
            isAccent ? "bg-accent-blue text-ink" : "bg-white text-ink"
          }`}
        >
          {/* Curved top edge */}
          <div
            className={`absolute -top-6 left-0 right-0 h-8 ${
              isAccent ? "bg-accent-blue" : "bg-white"
            }`}
            style={{
              borderRadius: "100% 100% 0 0 / 100% 100% 0 0",
              borderTop: "2px solid #1A1A1A",
              borderLeft: "2px solid #1A1A1A",
              borderRight: "2px solid #1A1A1A",
            }}
          />

          {/* Perforated line */}
          <div className="absolute top-2 left-4 right-4 border-t-2 border-dashed border-ink/20" />

          {/* Content */}
          <div className="pt-8 pb-8 px-8">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
};
