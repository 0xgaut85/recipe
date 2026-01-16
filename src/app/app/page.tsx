"use client";

import { useState } from "react";
import { WalletGate } from "@/components/app/WalletGate";
import { Terminal } from "@/components/app/Terminal";
import { LoadingOverlay } from "@/components/app/LoadingOverlay";

export type TradingStep = "describe" | "configure" | "review" | "deploy";

export default function AppPage() {
  const [currentStep, setCurrentStep] = useState<TradingStep>("describe");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState<TradingStep>("describe");

  const handleStepChange = (newStep: TradingStep) => {
    setTransitionStep(newStep);
    setIsTransitioning(true);
    
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
