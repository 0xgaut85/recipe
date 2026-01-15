import { FC } from "react";
import { GlassCard } from "@/components/ui";

const safetyFeatures = [
  "configurable risk limits (position caps, max trades/day)",
  "slippage protections and failure handling",
  "cooldowns and throttles (avoid death by noise)",
  "simulation-first recommended flow",
];

export const DocsSafety: FC = () => {
  return (
    <section id="safety" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        safety & guardrails
      </h2>
      <GlassCard variant="dark" className="p-8 md:p-10">
        <p className="text-white font-medium mb-6 lowercase">
          recipe is built for fast iteration, but not blind execution. we treat
          safety as part of the product loop, not an afterthought.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 text-white/80 text-sm font-mono lowercase">
          {safetyFeatures.map((feature, i) => (
            <div key={i} className="p-3 border border-white/20 rounded-lg">
              {feature}
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
};
