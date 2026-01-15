"use client";

import { FC, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { GlassCard } from "@/components/ui";

const socialLinks = [
  { label: "x", href: "https://x.com/recipedotmoney" },
  { label: "github", href: "#" },
];

// Smooth easing curve
const smoothEase = [0.22, 1, 0.36, 1];

export const CTA: FC = () => {
  const [showBetaToast, setShowBetaToast] = useState(false);

  const handleStartCooking = () => {
    setShowBetaToast(true);
    setTimeout(() => setShowBetaToast(false), 3000);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: smoothEase }}
        >
          <GlassCard
            variant="panel"
            className="p-12 md:p-20 text-center relative overflow-hidden"
          >
            {/* Background Blobs - Subtler animation */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-25">
              <motion.div
                animate={{ scale: [1, 1.05, 1], x: [0, 20, 0] }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-accent-pink/30 rounded-full blur-[100px]"
              />
              <motion.div
                animate={{ scale: [1, 1.08, 1], x: [0, -15, 0] }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] bg-accent-blue/30 rounded-full blur-[100px]"
              />
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: smoothEase }}
              className="font-display text-4xl md:text-6xl font-bold text-ink mb-6 tracking-tight lowercase"
            >
              ready to cook?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: smoothEase }}
              className="text-xl text-ink-light mb-12 max-w-xl mx-auto lowercase font-medium"
            >
              join the chefs in the kitchen.
              <br />
              start shipping strategies in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: smoothEase }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <button
                onClick={handleStartCooking}
                className="px-8 py-3.5 rounded-full bg-ink text-white font-bold hover:bg-black transition-all duration-200 border-2 border-ink shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A] lowercase"
              >
                start cooking
              </button>

              <Link
                href="/docs"
                className="px-8 py-3.5 rounded-full bg-white border-2 border-ink text-ink font-bold hover:bg-ink hover:text-white transition-all duration-200 shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A] lowercase"
              >
                read docs
              </Link>
            </motion.div>

            {/* Footer with logo and links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: smoothEase }}
              className="mt-16 pt-8 border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              {/* Left: Logo and Copyright */}
              <div className="flex items-center gap-4">
                <Image
                  src="/logo.jpg"
                  alt="recipe.money logo"
                  width={42}
                  height={42}
                  className="rounded-xl border border-ink/20"
                />
                <span className="text-sm font-medium text-ink/40 lowercase">
                  © 2026 recipe.money
                </span>
              </div>

              {/* Right: Social Links */}
              <div className="flex items-center gap-8 text-sm font-bold text-ink/40 uppercase tracking-widest">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ink transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Beta Toast */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{
          opacity: showBetaToast ? 1 : 0,
          y: showBetaToast ? 0 : 50,
          scale: showBetaToast ? 1 : 0.9,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-accent-blue border-2 border-ink rounded-2xl shadow-[6px_6px_0px_0px_#1A1A1A] pointer-events-none"
      >
        <p className="font-display font-bold text-ink text-lg lowercase">
          beta coming soon
        </p>
      </motion.div>
    </section>
  );
};
