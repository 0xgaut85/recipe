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
            Most trading tools are either pure intuition with no execution or
            heavy quant stacks that take forever to set up. Real traders
            don&apos;t have time for either.
          </p>
          <p className="text-lg leading-relaxed text-white/90">
            <strong className="text-white border-b-2 border-[#E57B3A]">
              CLAUDE TRADE
            </strong>{" "}
            is the first AI-powered trading platform that turns intent into execution
            instantly by combining Claude AI, auto-integrated data connectors and 
            a real-time execution layer on Solana.
          </p>
        </div>
      </GlassCard>
    </section>
  );
};
