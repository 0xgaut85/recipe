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
          integrating data sources, building pipelines, handling edge cases.
          By the time you&apos;ve built it, the opportunity is gone.
        </p>
        <p className="font-display text-xl font-semibold text-white border-l-4 border-[#E57B3A] pl-4">
          We wanted to shortcut that. What if you could just describe what you
          want?
        </p>
      </GlassCard>
    </section>
  );
};
