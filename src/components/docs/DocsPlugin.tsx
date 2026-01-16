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
          Claude Trade also ships a Claude Code plugin so users can trade from anywhere
          Claude is. This makes Claude a front-end for research and drafting,
          while Claude Trade remains the execution layer.
        </p>
        <ul className="space-y-3 text-white">
          {pluginExamples.map((example, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-2 h-2 bg-claude-orange rounded-full mt-2 flex-shrink-0" />
              &quot;{example}&quot;
            </li>
          ))}
        </ul>
      </GlassCard>
    </section>
  );
};
