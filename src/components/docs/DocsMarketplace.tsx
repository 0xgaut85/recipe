import { FC } from "react";

const marketplaceFeatures = [
  "Publish publicly or privately",
  "Monetize via subscriptions or usage fees",
  "Earn royalties on forks and downstream usage",
];

export const DocsMarketplace: FC = () => {
  return (
    <section id="marketplace" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Marketplace
      </h2>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 md:p-10">
        <p className="text-lg font-medium text-white mb-6">
          The goal is simple: the best strategies rise, builders get paid, users
          get execution without reinventing infrastructure.
        </p>
        <ul className="space-y-3 text-white/80">
          {marketplaceFeatures.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-2 h-2 bg-claude-orange rounded-full" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
