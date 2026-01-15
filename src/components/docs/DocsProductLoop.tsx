import { FC } from "react";
import { StepCard } from "@/components/ui";

const steps = [
  {
    num: "01",
    title: "write intent",
    desc: "user describes what they want to happen.",
    color: "bg-accent-pink",
  },
  {
    num: "02",
    title: "cook",
    desc: "claude code composes the strategy using built-in connectors and primitives.",
    color: "bg-accent-blue",
  },
  {
    num: "03",
    title: "taste",
    desc: "replay against recent market windows, simulate, and tune via iterative prompts.",
    color: "bg-white",
  },
  {
    num: "04",
    title: "serve",
    desc: "deploy as a live agent that monitors streams and executes with configured constraints.",
    color: "bg-white",
  },
];

export const DocsProductLoop: FC = () => {
  return (
    <section id="product-loop" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        core product loop
      </h2>
      <div className="space-y-4">
        {steps.map((step) => (
          <StepCard
            key={step.num}
            num={step.num}
            title={step.title}
            desc={step.desc}
            bgColor={step.color}
          />
        ))}
      </div>
    </section>
  );
};
