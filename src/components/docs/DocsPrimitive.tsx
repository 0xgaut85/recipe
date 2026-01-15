import { FC } from "react";

const primitives = [
  { title: "forkable", desc: "remix strategies like open-source" },
  { title: "versioned", desc: "improvements are explicit and trackable" },
  { title: "reproducible", desc: "behaves consistently under same conditions" },
  { title: "attributable", desc: "creators can be credited and compensated" },
];

export const DocsPrimitive: FC = () => {
  return (
    <section id="primitive" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        recipes as a primitive
      </h2>
      <p className="text-ink font-medium mb-6 lowercase">
        a recipe is not just a script. this turns strategy creation into a
        composable ecosystem.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {primitives.map((item) => (
          <div
            key={item.title}
            className="p-4 border-2 border-ink/10 rounded-xl bg-white"
          >
            <h4 className="font-bold text-ink lowercase">{item.title}</h4>
            <p className="text-sm text-ink-light lowercase">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
