"use client";

import { useState } from "react";
import { WalletGate } from "@/components/app/WalletGate";
import { Terminal } from "@/components/app/Terminal";
import { LoadingOverlay } from "@/components/app/LoadingOverlay";

export type CookingStep = "describe" | "cook" | "taste" | "serve";

export default function AppPage() {
  const [currentStep, setCurrentStep] = useState<CookingStep>("describe");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState<CookingStep>("describe");

  const handleStepChange = (newStep: CookingStep) => {
    setTransitionStep(newStep);
    setIsTransitioning(true);
    
    // Show loading for 1.5 seconds then transition
    setTimeout(() => {
      setCurrentStep(newStep);
      setIsTransitioning(false);
    }, 1500);
  };

  return (
    <WalletGate>
      <div className="h-screen w-screen relative">
        <Terminal 
          currentStep={currentStep} 
          onStepChange={handleStepChange} 
        />
        
        <LoadingOverlay 
          isVisible={isTransitioning} 
          step={transitionStep} 
        />
      </div>
    </WalletGate>
  );
}
