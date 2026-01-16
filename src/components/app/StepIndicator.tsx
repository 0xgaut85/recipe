"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import type { CookingStep } from "@/app/app/page";

const steps: { id: CookingStep; num: string; label: string }[] = [
  { id: "describe", num: "01", label: "describe" },
  { id: "cook", num: "02", label: "cook" },
  { id: "taste", num: "03", label: "taste" },
  { id: "serve", num: "04", label: "serve" },
];

interface StepIndicatorProps {
  currentStep: CookingStep;
  onStepClick?: (step: CookingStep) => void;
}

export const StepIndicator: FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;
        const isClickable = index <= currentIndex && onStepClick;

        return (
          <motion.button
            key={step.id}
            onClick={() => isClickable && onStepClick(step.id)}
            disabled={!isClickable}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
              isActive
                ? "bg-accent-pink border-accent-pink text-black"
                : isCompleted
                ? "bg-white/10 border-white/20 text-white cursor-pointer hover:bg-white/20"
                : "bg-transparent border-white/10 text-white/40 cursor-default"
            }`}
            whileHover={isClickable ? { scale: 1.02 } : {}}
            whileTap={isClickable ? { scale: 0.98 } : {}}
          >
            <span className="font-mono text-xs opacity-60">{step.num}</span>
            <span className="font-bold text-sm lowercase">{step.label}</span>
            
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 w-4 h-4 bg-accent-blue rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-2.5 h-2.5 text-black"
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
          </motion.button>
        );
      })}
    </div>
  );
};
