import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsInsight: FC = () => {
  return (
    <section id="insight" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        the insight
      </h2>
      <GlassCard variant="light" className="p-12 text-center">
        <p className="text-3xl font-display font-bold text-ink mb-6 lowercase">
          alpha isn&apos;t scarce. <br />
          <span className="bg-accent-blue px-2">execution speed is.</span>
        </p>
        <p className="text-ink font-medium lowercase mb-4">
          in the trenches, the difference between printing and coping is often
          how fast you can go from &quot;i think this will happen&quot; to
          &quot;this is running live&quot;.
        </p>
        <p className="text-ink font-bold lowercase">
          time-to-strategy must be minutes, not days.
        </p>
      </GlassCard>
    </section>
  );
};
