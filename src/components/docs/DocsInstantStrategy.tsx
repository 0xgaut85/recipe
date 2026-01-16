import { FC } from "react";

const examplePrompts = [
  "Watch Pump.fun launches with fast holder growth, enter on first sustained volume burst, exit on first distribution spike.",
  "Track these wallets; when 3 of them buy the same new token within 5 minutes, alert and simulate entry with tight exits.",
  "Filter DexScreener pairs by liquidity + volume velocity; only trade if liquidity is organic and buys aren't sybil-patterned.",
];

export const DocsInstantStrategy: FC = () => {
  return (
    <section id="instant-strategy" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Instant Strategy Creation
      </h2>
      <p className="text-white/70 mb-6">
        Claude Trade is optimized for near-instant strategy composition. Example
        prompts you can deploy immediately:
      </p>
      <div className="space-y-3 mb-8">
        {examplePrompts.map((prompt, i) => (
          <div
            key={i}
            className="p-5 bg-white/[0.02] border border-white/10 rounded-lg hover:border-claude-orange/30 transition-colors"
          >
            <p className="text-white/90 italic">
              &quot;{prompt}&quot;
            </p>
          </div>
        ))}
      </div>
      <div className="bg-claude-orange/10 border border-claude-orange/20 p-5 rounded-lg">
        <p className="text-white">
          Claude turns this into a runnable strategy, simulation config, and
          deployment settings.
          <br />
          <span className="font-semibold">
            You aren&apos;t coding integrations. You&apos;re choosing behavior.
          </span>
        </p>
      </div>
    </section>
  );
};
