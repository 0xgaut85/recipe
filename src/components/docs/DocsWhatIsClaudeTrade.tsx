import { FC } from "react";

const strategyDefinitions = [
  { label: "Watch", desc: "Pairs, wallets, pools, mints" },
  { label: "Interpret", desc: "Volume, price, liquidity, holders" },
  { label: "Act", desc: "Alerts, copy rules, entry/exit logic" },
  { label: "Adapt", desc: "Shift when the market shifts" },
];

export const DocsWhatIsClaudeTrade: FC = () => {
  return (
    <section id="what-is-claude-trade" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        What is Claude Trade?
      </h2>
      <p className="text-lg text-white font-medium leading-relaxed mb-8">
        Claude Trade is a Solana-native platform where users create, test, deploy and
        monetize trading strategies using natural language. Powered by Claude AI.
      </p>
      <p className="text-white/60 mb-6">
        A strategy is an executable object that defines:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {strategyDefinitions.map((item) => (
          <div
            key={item.label}
            className="p-5 bg-white/[0.02] border border-white/10 rounded-lg hover:border-[#E57B3A]/30 transition-colors"
          >
            <h4 className="font-semibold text-white mb-1">
              {item.label}
            </h4>
            <p className="text-sm text-white/60">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
