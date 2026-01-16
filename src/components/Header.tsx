"use client";

import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export const Header: FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ink/90 backdrop-blur-xl border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-wide flex items-center justify-between">
        <Link href="/" className="relative z-10 group flex items-center gap-3">
          <Image
            src="/claude.png"
            alt="Claude Trade"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-display font-semibold text-lg text-white tracking-tight group-hover:text-white/70 transition-colors">
            CLAUDE TRADE
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <Link
            href="/docs"
            className="text-white/60 text-sm font-medium hover:text-white transition-colors"
          >
            Documentation
          </Link>
          <a
            href="https://github.com/0xLaylo/recipe-plugin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 text-sm font-medium hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>

        <Link
          href="/app"
          className="px-5 py-2.5 rounded-lg bg-claude-orange text-white font-medium text-sm hover:bg-claude-orange/90 transition-all duration-200"
        >
          Launch App
        </Link>
      </div>
    </motion.header>
  );
};
