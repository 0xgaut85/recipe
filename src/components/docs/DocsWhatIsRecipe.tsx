import { FC } from "react";

const recipeDefinitions = [
  { label: "watch", desc: "pairs, wallets, pools, mints" },
  { label: "interpret", desc: "volume, price, liquidity, holders" },
  { label: "act", desc: "alerts, copy rules, entry/exit logic" },
  { label: "adapt", desc: "shift when the market shifts" },
];

export const DocsWhatIsRecipe: FC = () => {
  return (
    <section id="what-is-recipe" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        what is recipe?
      </h2>
      <p className="text-xl text-ink font-medium leading-relaxed mb-8 lowercase">
        recipe is a solana-native platform where users create, test, deploy, and
        monetize strategies using natural language—powered by claude code.
      </p>
      <p className="text-ink-light mb-8 font-medium lowercase">
        a &quot;recipe&quot; is an executable object that defines:
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        {recipeDefinitions.map((item) => (
          <div
            key={item.label}
            className="p-6 bg-white border-2 border-ink rounded-2xl shadow-[4px_4px_0px_0px_#1A1A1A]"
          >
            <h4 className="font-bold text-ink mb-2 lowercase text-lg">
              {item.label}
            </h4>
            <p className="text-sm text-ink/70 font-medium lowercase">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
