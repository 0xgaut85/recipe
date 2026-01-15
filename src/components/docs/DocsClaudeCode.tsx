import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsClaudeCode: FC = () => {
  return (
    <section id="claude-code" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        customized claude code
      </h2>
      <GlassCard variant="dark" className="p-8 md:p-12">
        <p className="text-white/90 mb-4 text-lg font-medium lowercase">
          recipe doesn&apos;t embed a generic chat assistant. we embed a custom
          workspace pre-wired to the solana trenches.
        </p>
        <p className="text-white/60 mb-8 lowercase font-medium">
          pre-built connectors (axiom, dexscreener, pump.fun), standardized data
          models, strategy templates, and &quot;one-click&quot; primitives.
        </p>
        <div className="space-y-4 font-mono text-sm lowercase">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/20">
            <p className="text-accent-pink mb-2 font-bold">
              {"// instead of:"}
            </p>
            <p className="text-white/60">
              write code → fetch data → normalize → debug → integrate → maybe
              run
            </p>
          </div>
          <div className="p-6 bg-accent-blue/10 rounded-2xl border-2 border-accent-blue">
            <p className="text-accent-blue mb-2 font-bold">{"// you do:"}</p>
            <p className="text-white font-bold">
              describe → claude cooks (using connectors) → simulate → deploy
            </p>
          </div>
        </div>
      </GlassCard>
    </section>
  );
};
