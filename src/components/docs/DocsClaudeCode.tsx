import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsClaudeCode: FC = () => {
  return (
    <section id="claude-code" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Customized Claude
      </h2>
      <GlassCard variant="default" className="p-8 md:p-10">
        <p className="text-white/90 mb-4 text-lg">
          Claude Trade doesn&apos;t embed a generic chat assistant. We embed a custom
          workspace pre-wired to Solana trading infrastructure.
        </p>
        <p className="text-white/60 mb-8">
          Pre-built connectors (Jupiter, DexScreener, Pump.fun), standardized data
          models, strategy templates, and one-click primitives.
        </p>
        <div className="space-y-4 font-mono text-sm">
          <div className="p-5 bg-white/5 rounded-lg border border-white/10">
            <p className="text-red-400 mb-2 font-medium">
              {"// The old way:"}
            </p>
            <p className="text-white/50">
              Write code → Fetch data → Normalize → Debug → Integrate → Maybe run
            </p>
          </div>
          <div className="p-5 bg-[#E57B3A]/10 rounded-lg border border-[#E57B3A]/30">
            <p className="text-[#E57B3A] mb-2 font-medium">{"// With Claude Trade:"}</p>
            <p className="text-white font-medium">
              Describe → Configure → Review → Deploy
            </p>
          </div>
        </div>
      </GlassCard>
    </section>
  );
};
