import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsWhySolana: FC = () => {
  return (
    <section id="why-solana" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        why solana
      </h2>
      <p className="text-ink font-medium mb-6 lowercase">
        vibetrading needs low latency, cheap execution, and a rich on-chain
        ecosystem. solana is where the trenches actually move fast enough for
        this to matter.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <GlassCard
          variant="dark"
          className="p-8 text-center hover:bg-black transition-colors"
        >
          <p className="font-bold text-3xl mb-2 text-accent-pink">400ms</p>
          <p className="text-white/60 text-sm font-medium lowercase">
            block time
          </p>
        </GlassCard>
        <GlassCard
          variant="blue"
          className="p-8 text-center hover:bg-accent-blue/90 transition-colors"
        >
          <p className="font-bold text-3xl mb-2 text-ink">~$0.00025</p>
          <p className="text-ink/60 text-sm font-medium lowercase">
            fee per tx
          </p>
        </GlassCard>
      </div>
    </section>
  );
};
