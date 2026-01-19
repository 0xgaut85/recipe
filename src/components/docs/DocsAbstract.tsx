import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsAbstract: FC = () => {
  return (
    <section id="abstract" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Abstract
      </h2>
      <GlassCard variant="default" className="p-8 md:p-10">
        <div className="relative z-10">
          <p className="text-lg leading-relaxed text-white/90 mb-6">
            We wanted to see what happens when you give an AI model actual tools
            to interact with markets - not just analysis, but execution.
          </p>
          <p className="text-lg leading-relaxed text-white/90">
            <strong className="text-white border-b-2 border-[#E57B3A]">
              Claude Trade
            </strong>{" "}
            connects Claude to Solana&apos;s DeFi infrastructure: price feeds,
            liquidity data, and swap execution through Jupiter. You describe what
            you want, Claude figures out how to do it.
          </p>
        </div>
      </GlassCard>
    </section>
  );
};
