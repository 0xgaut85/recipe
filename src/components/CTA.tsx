"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  { label: "X", href: "https://x.com/recipedotmoney" },
  { label: "GitHub", href: "https://github.com/0xLaylo/recipe-plugin" },
];

const smoothEase = [0.22, 1, 0.36, 1];

export const CTA: FC = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-ink">
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: smoothEase }}
        >
          <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-claude-orange/15 rounded-full blur-[150px] -z-10" />
            
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: smoothEase }}
              className="font-display text-3xl md:text-5xl font-semibold text-white mb-6 tracking-tight"
            >
              Ready to Trade Smarter?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: smoothEase }}
              className="text-lg text-white/60 mb-10 max-w-xl mx-auto font-normal"
            >
              Join traders using AI to execute strategies
              <br />
              faster than ever before.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: smoothEase }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/app"
                className="px-8 py-4 rounded-lg bg-claude-orange text-white font-semibold hover:bg-claude-orange/90 transition-all duration-200 min-w-[180px]"
              >
                Launch App
              </Link>

              <Link
                href="/docs"
                className="px-8 py-4 rounded-lg bg-white/5 border border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-200 min-w-[180px]"
              >
                Read Docs
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5, ease: smoothEase }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          {/* Left: Logo and Copyright */}
          <div className="flex items-center gap-4">
            <Image
              src="/claude.png"
              alt="Claude Trade"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-sm font-normal text-white/40">
              © 2026 CLAUDE TRADE
            </span>
          </div>

          {/* Right: Social Links */}
          <div className="flex items-center gap-8 text-sm font-medium text-white/40">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
