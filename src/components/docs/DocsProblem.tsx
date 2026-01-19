import { FC } from "react";
import { GlassCard, TagList } from "@/components/ui";

const signalTags = [
  "Volume Spikes",
  "Wallet Behavior",
  "Fresh Mints",
  "Liquidity Changes",
  "Social Momentum",
];

export const DocsProblem: FC = () => {
  return (
    <section id="problem" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        The Problem
      </h2>
      <GlassCard variant="accent" className="p-8 md:p-10">
        <p className="text-white mb-6 font-medium text-lg">
          Traders move on signals like:
        </p>
        <TagList tags={signalTags} className="mb-8" />
        <p className="text-white/80 mb-4">
          But converting those signals into a working strategy usually means
          manually integrating data sources, building pipelines, handling edge
          cases and maintaining infrastructure.
        </p>
        <p className="font-display text-xl font-semibold text-white border-l-4 border-[#E57B3A] pl-4">
          Good ideas die before they ship. Manual trading happens too late.
        </p>
      </GlassCard>
    </section>
  );
};
