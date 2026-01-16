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
    <aside
      className="fixed left-0 top-0 h-screen w-72 border-r border-gray-200 pt-24 pb-8 overflow-hidden z-40 hidden lg:block"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="px-8 mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-all text-sm mb-6 group"
          style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
        >
          <span>←</span>
          <span>Back</span>
        </Link>
        <h2
          className="text-xl text-black tracking-tight"
          style={{ fontFamily: "TWKEverett-Regular, sans-serif" }}
        >
          Documentation
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
              <h3
                className="text-xs text-gray-400 uppercase tracking-widest mb-3 px-2"
                style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
              >
                {group.title}
              </h3>
              <ul className="space-y-1 relative">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionClick(item.id)}
                      className={`w-full text-left px-4 py-2 text-sm transition-all relative ${
                        activeSection === item.id
                          ? "text-[#E57B3A] font-medium"
                          : "text-gray-600 hover:text-black"
                      }`}
                      style={{
                        fontFamily: "TWKEverettMono-Regular, monospace",
                        borderRadius: 0,
                        backgroundColor:
                          activeSection === item.id
                            ? "rgba(255, 77, 0, 0.1)"
                            : "transparent",
                      }}
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
