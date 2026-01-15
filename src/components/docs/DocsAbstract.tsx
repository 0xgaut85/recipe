import { FC } from "react";
import { GlassCard } from "@/components/ui";

export const DocsAbstract: FC = () => {
  return (
    <section id="abstract" className="scroll-mt-32">
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        abstract
      </h2>
      <GlassCard variant="dark" className="p-8 md:p-12">
        <div className="relative z-10">
          <p className="text-lg leading-relaxed text-white/90 mb-6 font-medium lowercase">
            most trading &quot;tools&quot; are either pure vibes with no execution or
            heavy quant stacks that take forever to wire up. the trenches
            don&apos;t have time for either.
          </p>
          <p className="text-lg leading-relaxed text-white/90 font-medium lowercase">
            <strong className="text-white border-b-2 border-accent-pink">
              recipe
            </strong>{" "}
            is the first vibetrading platform that turns intent into execution
            almost instantly by combining a customized claude code experience,
            auto-integrated data connectors, and a real-time execution layer.
          </p>
        </div>
      </GlassCard>
    </section>
  );
};
