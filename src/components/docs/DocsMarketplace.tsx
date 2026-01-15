import { FC } from "react";

const marketplaceFeatures = [
  "publish publicly or privately",
  "monetize via subscriptions or usage fees",
  "earn royalties on forks and downstream usage",
];

export const DocsMarketplace: FC = () => {
  return (
    <section id="marketplace" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        marketplace
      </h2>
      <div className="bg-white border-2 border-ink rounded-3xl p-10 shadow-[8px_8px_0px_0px_#1A1A1A]">
        <p className="text-xl font-bold text-ink mb-6 lowercase">
          the goal is simple: the best strategies rise, builders get paid, users
          get execution without reinventing infra.
        </p>
        <ul className="space-y-4 text-ink font-medium lowercase">
          {marketplaceFeatures.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-2 h-2 bg-ink rounded-full" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
