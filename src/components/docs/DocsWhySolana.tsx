import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsWhySolana: FC = () => {
  return (
    <section id="why-solana" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Why Solana
      </h2>
      <p className="text-white/70 mb-6">
        AI-powered trading needs low latency, cheap execution, and a rich on-chain
        ecosystem. Solana is where markets move fast enough for
        this to matter.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <GlassCard
          variant="default"
          className="p-8 text-center hover:bg-white/5 transition-colors"
        >
          <p className="font-semibold text-3xl mb-2 text-claude-orange">400ms</p>
          <p className="text-white/60 text-sm">
            Block time
          </p>
        </GlassCard>
        <GlassCard
          variant="accent"
          className="p-8 text-center hover:bg-claude-orange/15 transition-colors"
        >
          <p className="font-semibold text-3xl mb-2 text-white">~$0.00025</p>
          <p className="text-white/60 text-sm">
            Fee per transaction
          </p>
        </GlassCard>
      </div>
    </section>
  );
};
