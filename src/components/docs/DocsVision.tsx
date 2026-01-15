import { FC } from "react";

const visionPoints = [
  "the default place to cook execution logic",
  "a shared library of on-chain market behavior",
  "an execution layer claude can plug into",
  'a marketplace where "good taste" becomes a monetizable asset',
];

export const DocsVision: FC = () => {
  return (
    <section id="vision" className="scroll-mt-32 pb-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        vision
      </h2>
      <div className="text-center space-y-8 bg-white border-2 border-ink rounded-[2rem] p-12 shadow-[8px_8px_0px_0px_#1A1A1A]">
        <ul className="text-left space-y-2 text-ink-light font-medium lowercase mb-8 mx-auto max-w-lg">
          {visionPoints.map((point, i) => (
            <li key={i}>— {point}</li>
          ))}
        </ul>
        <p className="text-3xl font-display font-bold text-ink lowercase">
          not just trading tools.
          <br />
          <span className="bg-accent-pink px-2">cooked into execution.</span>
        </p>
        <div className="inline-block p-6 bg-ink rounded-2xl shadow-[4px_4px_0px_0px_#B8D4E3]">
          <span className="text-4xl text-white font-display font-bold">
            time to cook.
          </span>
        </div>
      </div>
    </section>
  );
};
