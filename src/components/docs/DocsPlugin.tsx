import { FC } from "react";
import { GlassCard } from "@/components/ui";

const pluginExamples = [
  "Analyze this wallet and summarize its behavior patterns",
  "Turn this observation into a strategy with entries/exits and risk limits",
  "Fork the top strategy for this market and adapt it to my rules",
];

export const DocsPlugin: FC = () => {
  return (
    <section id="plugin" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Claude Plugin
      </h2>
      <GlassCard variant="default" className="p-8">
        <p className="text-white/80 mb-6">
          The MCP plugin lets you use Claude Trade from Claude Code. Claude becomes
          the interface for research and strategy drafting. The execution layer
          stays on Solana.
        </p>
        <p className="text-white/80 mb-6">
          Beyond single strategies, you can build a coordinated team of agents. A
          researcher that monitors wallets 24/7. A DeFi intern that tracks new pools.
          A trencher catching pump.fun launches. An executor that never sleeps. Each
          agent develops its own working patterns while sharing context with the team.
        </p>
        <ul className="space-y-3 text-white">
          {pluginExamples.map((example, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-2 h-2 bg-[#E57B3A] rounded-full mt-2 flex-shrink-0" />
              &quot;{example}&quot;
            </li>
          ))}
        </ul>
      </GlassCard>
    </section>
  );
};
