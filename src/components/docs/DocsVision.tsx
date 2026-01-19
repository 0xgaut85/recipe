import { FC } from "react";

const visionPoints = [
  "The default place to create trading logic",
  "A shared library of on-chain market behavior",
  "An execution layer Claude can plug into",
  "A marketplace where good strategies become monetizable assets",
];

export const DocsVision: FC = () => {
  return (
    <section id="vision" className="scroll-mt-32 pb-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Vision
      </h2>
      <div className="text-center space-y-8 bg-white/[0.02] border border-white/10 rounded-xl p-10 md:p-12">
        <ul className="text-left space-y-2 text-white/60 mb-8 mx-auto max-w-lg">
          {visionPoints.map((point, i) => (
            <li key={i}>• {point}</li>
          ))}
        </ul>
        <p className="text-2xl font-display font-semibold text-white">
          Not just trading tools.
          <br />
          <span className="bg-[#E57B3A]/15 text-[#E57B3A] px-2 rounded">Built for execution.</span>
        </p>
        <div className="inline-block p-6 bg-[#E57B3A] rounded-xl">
          <span className="text-3xl text-white font-display font-semibold">
            Trade with Intelligence.
          </span>
        </div>
      </div>
    </section>
  );
};
