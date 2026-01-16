import { FC } from "react";
import { StepCard } from "@/components/ui";

const steps = [
  {
    num: "01",
    title: "Describe",
    desc: "User describes what they want to happen in natural language.",
    color: "bg-[#E57B3A]/10",
  },
  {
    num: "02",
    title: "Configure",
    desc: "Claude composes the strategy using built-in connectors and primitives.",
    color: "bg-white/5",
  },
  {
    num: "03",
    title: "Review",
    desc: "Replay against recent market windows, simulate, and tune via iterative prompts.",
    color: "bg-white/[0.02]",
  },
  {
    num: "04",
    title: "Deploy",
    desc: "Deploy as a live agent that monitors streams and executes with configured constraints.",
    color: "bg-white/[0.02]",
  },
];

export const DocsProductLoop: FC = () => {
  return (
    <section id="product-loop" className="scroll-mt-32">
      <h2 className="font-display text-2xl font-semibold text-white mb-6">
        Core Product Loop
      </h2>
      <div className="space-y-3">
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
