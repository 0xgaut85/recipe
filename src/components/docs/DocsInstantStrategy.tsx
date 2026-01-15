import { FC } from "react";

const examplePrompts = [
  "watch pump.fun launches with fast holder growth, enter on first sustained volume burst, exit on first distribution spike.",
  "track these wallets; when 3 of them buy the same new token within 5 minutes, alert and simulate entry with tight exits.",
  "filter dexscreener pairs by liquidity + volume velocity; only trade if liquidity is organic and buys aren't sybil-patterned.",
];

export const DocsInstantStrategy: FC = () => {
  return (
    <section id="instant-strategy" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        instant strategy creation
      </h2>
      <p className="text-ink font-medium mb-8 lowercase">
        recipe is optimized for near-instant strategy composition. example
        prompts you can ship quickly:
      </p>
      <div className="space-y-4 mb-8">
        {examplePrompts.map((prompt, i) => (
          <div
            key={i}
            className="p-6 bg-white border-2 border-ink rounded-2xl shadow-[4px_4px_0px_0px_#B8D4E3]"
          >
            <p className="text-ink font-bold italic lowercase">
              &quot;{prompt}&quot;
            </p>
          </div>
        ))}
      </div>
      <div className="bg-ink/5 p-6 rounded-2xl">
        <p className="text-ink lowercase font-medium">
          claude code turns this into a runnable recipe, simulation config, and
          deployment settings.
          <br />
          <span className="font-bold">
            you aren&apos;t coding integrations. you&apos;re choosing behavior.
          </span>
        </p>
      </div>
    </section>
  );
};
