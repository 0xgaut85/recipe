import { FC } from "react";
import { GlassCard, TagList } from "@/components/ui";

const signalTags = [
  "volume spikes",
  "wallet behavior",
  "fresh mints",
  "liquidity changes",
  "social momentum",
];

export const DocsProblem: FC = () => {
  return (
    <section id="problem" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        the problem
      </h2>
      <GlassCard variant="pink" className="p-8 md:p-12">
        <p className="text-ink mb-6 font-bold text-lg lowercase">
          traders move on signals like:
        </p>
        <TagList tags={signalTags} className="mb-8" />
        <p className="text-ink mb-4 font-medium lowercase">
          but converting those signals into a working strategy usually means
          manually integrating data sources, building pipelines, handling edge
          cases, and maintaining infra.
        </p>
        <p className="font-display text-2xl font-bold text-ink lowercase border-l-4 border-ink pl-4">
          good ideas die before they ship. manual trading happens too late.
        </p>
      </GlassCard>
    </section>
  );
};
