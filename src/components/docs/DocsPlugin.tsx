import { FC } from "react";
import { GlassCard } from "@/components/ui";

const pluginExamples = [
  "analyze this wallet and summarize its behavior patterns",
  "turn this observation into a recipe with entries/exits and risk limits",
  "fork the top recipe for this meta and adapt it to my rules",
];

export const DocsPlugin: FC = () => {
  return (
    <section id="plugin" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        the claude code plugin
      </h2>
      <GlassCard variant="light" className="p-8 bg-white/50">
        <p className="text-ink font-medium mb-6 lowercase">
          recipe also ships a claude code plugin so users can cook from anywhere
          claude is. this makes claude a front-end for research + drafting,
          while recipe remains the execution layer.
        </p>
        <ul className="space-y-3 text-ink font-medium lowercase">
          {pluginExamples.map((example, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-2 h-2 bg-accent-blue rounded-full mt-2" />
              &quot;{example}&quot;
            </li>
          ))}
        </ul>
      </GlassCard>
    </section>
  );
};
