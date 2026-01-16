"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import type { TradingStep } from "@/app/app/page";

const steps: { id: TradingStep; num: string; label: string }[] = [
  { id: "describe", num: "01", label: "Describe" },
  { id: "configure", num: "02", label: "Configure" },
  { id: "review", num: "03", label: "Review" },
  { id: "deploy", num: "04", label: "Deploy" },
];

interface StepIndicatorProps {
  currentStep: TradingStep;
}

export const StepIndicator: FC<StepIndicatorProps> = ({ currentStep }) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;

        return (
          <div
            key={step.id}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              isActive
                ? "bg-claude-orange/10 border-claude-orange/30 text-claude-orange"
                : isCompleted
                ? "bg-ink/5 border-ink/10 text-ink"
                : "bg-transparent border-ink/10 text-ink/40"
            }`}
          >
            <span className="font-mono text-xs opacity-60">{step.num}</span>
            <span className="font-medium text-sm">{step.label}</span>
            
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};
