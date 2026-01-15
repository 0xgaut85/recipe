"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { DocsSidebar, DocGroup } from "@/components/DocsSidebar";
import {
  DocsAbstract,
  DocsProblem,
  DocsInsight,
  DocsWhatIsRecipe,
  DocsClaudeCode,
  DocsInstantStrategy,
  DocsProductLoop,
  DocsPlugin,
  DocsPrimitive,
  DocsMarketplace,
  DocsSafety,
  DocsWhySolana,
  DocsVision,
} from "@/components/docs";

const docGroups: DocGroup[] = [
  {
    title: "introduction",
    items: [
      { id: "abstract", title: "abstract" },
      { id: "problem", title: "the problem" },
      { id: "insight", title: "the insight" },
    ],
  },
  {
    title: "platform",
    items: [
      { id: "what-is-recipe", title: "what is recipe?" },
      { id: "claude-code", title: "customized claude" },
      { id: "instant-strategy", title: "instant strategy" },
      { id: "product-loop", title: "core loop" },
    ],
  },
  {
    title: "features",
    items: [
      { id: "plugin", title: "claude plugin" },
      { id: "primitive", title: "recipes primitive" },
      { id: "marketplace", title: "marketplace" },
      { id: "safety", title: "safety" },
    ],
  },
  {
    title: "ecosystem",
    items: [
      { id: "why-solana", title: "why solana" },
      { id: "vision", title: "vision" },
    ],
  },
];

const allSections = docGroups.flatMap((g) => g.items);

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("abstract");

  const handleSectionClick = useCallback((id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );

    allSections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-ink/10 px-6 py-4">
        <a
          href="/"
          className="flex items-center gap-2 text-ink font-bold text-sm lowercase"
        >
          <span>←</span>
          <span>back to home</span>
        </a>
      </div>

      <DocsSidebar
        groups={docGroups}
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
      />

      <main className="lg:ml-72 w-full">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-24 lg:py-32">
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-24 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white border-2 border-ink text-ink text-xs font-bold uppercase tracking-wider mb-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
                documentation
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-ink mb-6 lowercase">
                recipe
              </h1>
              <p className="text-xl text-ink max-w-lg mx-auto font-medium lowercase">
                turn intent into execution. the first vibetrading platform on
                solana.
              </p>
            </div>

            {/* Introduction Group */}
            <div className="relative border-l-2 border-ink pl-8 md:pl-12 space-y-32 mb-32">
              <DocsAbstract />
              <DocsProblem />
              <DocsInsight />
            </div>

            {/* Platform Group */}
            <div className="relative border-l-2 border-ink pl-8 md:pl-12 space-y-32 mb-32">
              <DocsWhatIsRecipe />
              <DocsClaudeCode />
              <DocsInstantStrategy />
              <DocsProductLoop />
            </div>

            {/* Features & Ecosystem Group */}
            <div className="relative border-l-2 border-ink pl-8 md:pl-12 space-y-32 mb-32">
              <DocsPlugin />
              <DocsPrimitive />
              <DocsMarketplace />
              <DocsSafety />
              <DocsWhySolana />
              <DocsVision />
            </div>
          </motion.article>
        </div>
      </main>
    </div>
  );
}
