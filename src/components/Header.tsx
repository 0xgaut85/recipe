"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export const Header: FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      className="fixed top-0 left-0 right-0 z-50 py-4 sm:py-5 md:py-6"
      style={{ backgroundColor: "#000000", width: "100%" }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex justify-between items-center min-h-[60px] sm:min-h-[80px]"
          style={{ height: "auto" }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center transform transition-transform duration-300 hover:scale-105"
          >
            <Image
              src="/transparentlogo.png"
              alt="Claude Trade"
              width={48}
              height={48}
              className="mr-3"
              style={{ borderRadius: 0 }}
            />
            <span
              className="text-white text-lg font-normal"
              style={{
                fontFamily: "TWKEverettMono-Regular, monospace",
                letterSpacing: "-0.5px",
              }}
            >
              claudetrade
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-white hover:text-white/80 transition-colors duration-200 header-link"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              HOME
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-white hover:text-white/80 transition-colors duration-200 header-link"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              DOCS
            </Link>
            <a
              href="https://github.com/thinkbigcd/claude-trade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white hover:text-white/80 transition-colors duration-200 header-link"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              GITHUB
            </a>
          </div>

          {/* CTA Button */}
          <Link
            href="/app"
            className="hidden sm:flex items-center justify-center text-center transition-all duration-200 hover:opacity-90 r1x-button r1x-button-primary"
            style={{
              padding: "12px 24px",
              fontSize: "12px",
              fontWeight: 400,
              whiteSpace: "nowrap",
            }}
          >
            Launch App
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center text-white"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#000000",
              padding: "8px 16px",
              clipPath:
                "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
              fontFamily: "TWKEverettMono-Regular, monospace",
              fontSize: "12px",
              fontWeight: 400,
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Menu"
          >
            {menuOpen ? "CLOSE" : "MENU"}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-30"
              style={{ top: "80px" }}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
                opacity: { duration: 0.2 },
              }}
              className="fixed top-[80px] right-0 w-full max-w-sm bg-white border-l border-gray-200 shadow-2xl z-40 h-[calc(100vh-80px)] overflow-y-auto"
            >
              <div className="px-6 py-8 space-y-4">
                <h3
                  className="text-black text-lg font-medium mb-6"
                  style={{
                    fontFamily: "TWKEverettMono-Regular, monospace",
                    color: "#000000",
                  }}
                >
                  Navigation
                </h3>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm py-3 transition-colors duration-200"
                  style={{
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "TWKEverettMono-Regular, monospace",
                    color: "#E57B3A",
                  }}
                >
                  HOME
                </Link>
                <Link
                  href="/docs"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm py-3 transition-colors duration-200"
                  style={{
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "TWKEverettMono-Regular, monospace",
                    color: "#E57B3A",
                  }}
                >
                  DOCS
                </Link>
                <a
                  href="https://github.com/thinkbigcd/claude-trade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm py-3 transition-colors duration-200"
                  style={{
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "TWKEverettMono-Regular, monospace",
                    color: "#000000",
                  }}
                >
                  GITHUB
                </a>
                <div
                  className="border-t border-black my-3"
                  style={{ borderColor: "#000000", borderWidth: "1px" }}
                />
                <Link
                  href="/app"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm py-3 transition-colors duration-200"
                  style={{
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "TWKEverettMono-Regular, monospace",
                    color: "#E57B3A",
                  }}
                >
                  LAUNCH APP
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
