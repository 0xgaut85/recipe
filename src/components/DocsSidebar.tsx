"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export interface DocSection {
  id: string;
  title: string;
}

export interface DocGroup {
  title: string;
  items: DocSection[];
}

interface DocsSidebarProps {
  groups: DocGroup[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export const DocsSidebar: FC<DocsSidebarProps> = ({
  groups,
  activeSection,
  onSectionClick,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r-2 border-ink pt-24 pb-8 overflow-hidden z-40 hidden lg:block">
      <div className="px-8 mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-ink hover:underline-pink transition-all text-sm font-bold mb-6 lowercase group"
        >
          <span>←</span>
          <span>back</span>
        </Link>
        <h2 className="font-display font-bold text-xl text-ink tracking-tight lowercase">
          documentation
        </h2>
      </div>

      <nav className="docs-sidebar h-[calc(100%-140px)] overflow-y-auto px-6">
        <div className="space-y-8">
          {groups.map((group, i) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="text-xs font-bold text-ink uppercase tracking-widest mb-3 px-2 border-b-2 border-ink/10 pb-1 w-fit">
                {group.title}
              </h3>
              <ul className="space-y-2 relative">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionClick(item.id)}
                      className={`w-full text-left px-4 py-2 text-sm transition-all relative rounded-xl border-2 ${
                        activeSection === item.id
                          ? "bg-accent-pink text-ink border-ink font-bold shadow-[2px_2px_0px_0px_#1A1A1A]"
                          : "border-transparent text-ink/70 hover:text-ink hover:border-ink/10"
                      }`}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </nav>
    </aside>
  );
};
