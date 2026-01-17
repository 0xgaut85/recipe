"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { DocsSidebar, DocGroup } from "@/components/DocsSidebar";
import {
  DocsAbstract,
  DocsProblem,
  DocsInsight,
  DocsWhatIsClaudeTrade,
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
    title: "Introduction",
    items: [
      { id: "abstract", title: "Abstract" },
      { id: "problem", title: "The Problem" },
      { id: "insight", title: "The Insight" },
    ],
  },
  {
    title: "Platform",
    items: [
      { id: "what-is-claude-trade", title: "What is Claude Trade?" },
      { id: "claude-code", title: "Customized Claude" },
      { id: "instant-strategy", title: "Instant Strategy" },
      { id: "product-loop", title: "Core Loop" },
    ],
  },
  {
    title: "Features",
    items: [
      { id: "plugin", title: "Claude Plugin" },
      { id: "primitive", title: "Strategy Primitive" },
      { id: "marketplace", title: "Marketplace" },
      { id: "safety", title: "Safety" },
    ],
  },
  {
    title: "Ecosystem",
    items: [
      { id: "why-solana", title: "Why Solana" },
      { id: "vision", title: "Vision" },
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
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/10 px-6 py-4"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <a
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
        >
          <span>←</span>
          <span>Back to Home</span>
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
              <span
                className="inline-block px-4 py-1.5 text-xs uppercase tracking-wider mb-6"
                style={{
                  backgroundColor: "rgba(229, 123, 58, 0.15)",
                  color: "#E57B3A",
                  fontFamily: "TWKEverettMono-Regular, monospace",
                  clipPath:
                    "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                }}
              >
                Documentation
              </span>
              <h1
                className="text-5xl md:text-6xl text-white mb-6"
                style={{ fontFamily: "TWKEverett-Regular, sans-serif" }}
              >
                CLAUDE TRADE
              </h1>
              <p
                className="text-lg text-gray-400 max-w-lg mx-auto"
                style={{ fontFamily: "BaselGrotesk-Regular, sans-serif" }}
              >
                Turn intent into execution. The first AI-powered trading platform on Solana.
              </p>
            </div>

            {/* Introduction Group */}
            <div className="relative border-l border-white/10 pl-8 md:pl-12 space-y-24 mb-24">
              <DocsAbstract />
              <DocsProblem />
              <DocsInsight />
            </div>

            {/* Platform Group */}
            <div className="relative border-l border-white/10 pl-8 md:pl-12 space-y-24 mb-24">
              <DocsWhatIsClaudeTrade />
              <DocsClaudeCode />
              <DocsInstantStrategy />
              <DocsProductLoop />
            </div>

            {/* Features & Ecosystem Group */}
            <div className="relative border-l border-white/10 pl-8 md:pl-12 space-y-24 mb-24">
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
