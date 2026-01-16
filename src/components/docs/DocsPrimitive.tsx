import { FC } from "react";

const primitives = [
  { title: "Forkable", desc: "Remix strategies like open-source" },
  { title: "Versioned", desc: "Improvements are explicit and trackable" },
  { title: "Reproducible", desc: "Behaves consistently under same conditions" },
  { title: "Attributable", desc: "Creators can be credited and compensated" },
];

export const DocsPrimitive: FC = () => {
  return (
    <section id="primitive" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Strategies as a Primitive
      </h2>
      <p className="text-white/70 mb-6">
        A strategy is not just a script. This turns strategy creation into a
        composable ecosystem.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {primitives.map((item) => (
          <div
            key={item.title}
            className="p-4 border border-white/10 rounded-lg bg-white/[0.02] hover:border-[#E57B3A]/30 transition-colors"
          >
            <h4 className="font-semibold text-white">{item.title}</h4>
            <p className="text-sm text-white/60">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
