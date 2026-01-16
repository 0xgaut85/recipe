import { FC } from "react";
import { GlassCard } from "@/components/ui";

const safetyFeatures = [
  "Configurable risk limits (position caps, max trades/day)",
  "Slippage protections and failure handling",
  "Cooldowns and throttles (avoid death by noise)",
  "Simulation-first recommended flow",
];

export const DocsSafety: FC = () => {
  return (
    <section id="safety" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Safety & Guardrails
      </h2>
      <GlassCard variant="default" className="p-8 md:p-10">
        <p className="text-white/90 mb-6">
          Claude Trade is built for fast iteration, but not blind execution. We treat
          safety as part of the product loop, not an afterthought.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {safetyFeatures.map((feature, i) => (
            <div key={i} className="p-4 border border-white/10 rounded-lg bg-white/5 text-white/80">
              {feature}
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
};
