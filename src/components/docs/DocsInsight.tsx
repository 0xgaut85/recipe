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
          Alpha isn&apos;t scarce. <br />
          <span className="bg-[#E57B3A]/15 text-[#E57B3A] px-2 rounded">Execution speed is.</span>
        </p>
        <p className="text-white/70 mb-4">
          The difference between profit and loss is often
          how fast you can go from &quot;I think this will happen&quot; to
          &quot;this is running live&quot;.
        </p>
        <p className="text-white font-semibold">
          Time-to-strategy must be seconds, not days.
        </p>
      </GlassCard>
    </section>
  );
};
