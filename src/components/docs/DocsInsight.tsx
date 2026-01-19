import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsInsight: FC = () => {
  return (
    <section id="insight" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        The Insight
      </h2>
      <GlassCard variant="default" className="p-10 text-center">
        <p className="text-2xl font-display font-semibold text-white mb-6">
          The interesting part isn&apos;t the execution. <br />
          <span className="bg-[#E57B3A]/15 text-[#E57B3A] px-2 rounded">It&apos;s the reasoning.</span>
        </p>
        <p className="text-white/70 mb-4">
          Tell Claude to &quot;buy tokens that look legit&quot; and it develops
          heuristics around holder distribution, liquidity patterns, social signals.
          None of this is magic - it&apos;s just an LLM with tools.
        </p>
        <p className="text-white font-semibold">
          But the emergent behavior when you let it iterate is genuinely interesting.
        </p>
      </GlassCard>
    </section>
  );
};
