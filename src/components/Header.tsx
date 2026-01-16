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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-ink/5 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container-wide flex items-center justify-between">
        <Link href="/" className="pl-0 relative z-10 group flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="recipe.money logo"
            width={52}
            height={52}
            className="rounded-xl border border-ink/20"
          />
          <span className="font-display font-bold text-xl text-ink tracking-tight group-hover:text-ink/70 transition-colors lowercase hidden sm:inline">
            recipe
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-12">
          <Link
            href="/docs"
            className="text-ink text-sm font-medium underline-pink hover:text-ink/80 transition-colors lowercase"
          >
            what&apos;s recipe?
          </Link>
        </nav>

        <Link
          href="/app"
          className="px-6 py-2.5 rounded-full bg-ink text-white font-bold text-sm hover:bg-black transition-all duration-200 border-2 border-ink shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A] lowercase"
        >
          start cooking
        </Link>
      </div>
    </motion.header>
  );
};
