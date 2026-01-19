"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, Mail } from "lucide-react";

const socialLinks = [
  { icon: <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />, href: "https://x.com/claudetrade", label: "X" },
  { icon: <Github className="w-4 h-4 sm:w-5 sm:h-5" />, href: "https://github.com/0xgaut85/recipe", label: "GitHub" },
  { icon: <Mail className="w-4 h-4 sm:w-5 sm:h-5" />, href: "#", label: "Email" },
];

const smoothEase = [0.22, 1, 0.36, 1];

export const CTA: FC = () => {
  return (
    <footer
      className="border-t border-gray-200"
      style={{ backgroundColor: "#F7F7F7", paddingTop: "64px", paddingBottom: "64px" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: smoothEase }}
          className="text-center mb-16"
        >
          <h2
            className="text-black text-3xl sm:text-4xl md:text-[46.45px] leading-tight md:leading-[51.095px] mb-6"
            style={{
              fontWeight: 400,
              fontFamily: "TWKEverett-Regular, sans-serif",
              letterSpacing: "-1.858px",
              color: "rgb(0, 0, 0)",
            }}
          >
            Try It Yourself
          </h2>

          <p
            className="text-lg mb-10 max-w-xl mx-auto"
            style={{
              fontWeight: 400,
              fontFamily: "BaselGrotesk-Regular, sans-serif",
              lineHeight: "1.4",
              color: "rgb(0, 0, 0)",
            }}
          >
            This is early software. If you&apos;re curious about giving LLMs
            financial agency, this is a good place to start.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="r1x-button r1x-button-primary text-sm md:text-[14px] font-normal transition-all duration-300 button-hover text-center w-full sm:w-auto"
              style={{
                padding: "16px 32px",
                minWidth: "180px",
              }}
            >
              Launch App
            </Link>

            <Link
              href="/docs"
              className="r1x-button text-sm md:text-[14px] font-normal transition-all duration-300 text-center w-full sm:w-auto"
              style={{
                padding: "16px 32px",
                minWidth: "180px",
                backgroundColor: "transparent",
                color: "#000000",
                border: "2px solid #000000",
              }}
            >
              Read Docs
            </Link>
          </div>
        </motion.div>

        {/* Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Newsletter */}
          <div className="sm:col-span-2">
            <p
              className="text-xs sm:text-sm font-medium text-black mb-3 sm:mb-4"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              STAY UP TO DATE WITH CLAUDETRADE
            </p>
            <div className="flex flex-col gap-2 mb-4 sm:mb-6">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-[#E57B3A] focus:ring-1 focus:ring-[#E57B3A]"
                style={{ borderRadius: "0px" }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto text-white px-4 sm:px-6 py-2 text-sm transition-all duration-200 hover:opacity-90 whitespace-nowrap r1x-button r1x-button-primary"
                style={{
                  fontFamily: "TWKEverettMono-Regular, monospace",
                }}
              >
                Subscribe
              </motion.button>
            </div>
            <div className="flex gap-3 sm:gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  whileHover={{ scale: 1.1, color: "#E57B3A" }}
                  whileTap={{ scale: 0.95 }}
                  className="text-black hover:text-[#E57B3A] transition-all duration-200"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4
              className="text-xs sm:text-sm font-medium text-black mb-3 sm:mb-4"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              NAVIGATION
            </h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-[#E57B3A] transition-colors duration-200 text-xs sm:text-sm"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  HOME
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-gray-600 hover:text-[#E57B3A] transition-colors duration-200 text-xs sm:text-sm"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  DOCS
                </Link>
              </li>
              <li>
                <Link
                  href="/app"
                  className="text-gray-600 hover:text-[#E57B3A] transition-colors duration-200 text-xs sm:text-sm"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  APP
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="text-xs sm:text-sm font-medium text-black mb-3 sm:mb-4"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              RESOURCES
            </h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <a
                  href="https://github.com/0xgaut85/recipe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#E57B3A] transition-colors duration-200 text-xs sm:text-sm"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  GITHUB
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/claudetrade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#E57B3A] transition-colors duration-200 text-xs sm:text-sm"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  X / TWITTER
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/transparentlogo.png"
                alt="Claude Trade"
                width={28}
                height={28}
                style={{ borderRadius: "0px" }}
              />
              <p
                className="text-gray-600 text-xs sm:text-sm"
                style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
              >
                ©2026 claudetrade. ALL RIGHTS RESERVED.
              </p>
            </div>
            <ul className="flex flex-wrap gap-4 sm:gap-6">
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-[#E57B3A] text-xs sm:text-sm transition-colors duration-200"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  PRIVACY POLICY
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-[#E57B3A] text-xs sm:text-sm transition-colors duration-200"
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
                >
                  TERMS OF SERVICE
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
