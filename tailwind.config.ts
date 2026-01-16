import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F7F7",
        foreground: "#000000",
        ink: "#000000",
        "ink-light": "#525252",
        "ink-muted": "#737373",
        white: "#FFFFFF",
        black: "#000000",
        accent: "#E57B3A",
        "accent-light": "#F59E5E",
        "accent-dark": "#CC6A2E",
        claude: {
          orange: "#E57B3A",
          "orange-light": "#F59E5E",
          "orange-dark": "#CC6A2E",
        },
        gray: {
          50: "#F7F7F7",
          100: "#F3F3F3",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      fontFamily: {
        display: ["TWKEverett-Regular", "system-ui", "sans-serif"],
        body: ["BaselGrotesk-Regular", "system-ui", "sans-serif"],
        mono: ["TWKEverettMono-Regular", "monospace"],
        basel: ["BaselGrotesk-Regular", "sans-serif"],
        everett: ["TWKEverett-Regular", "sans-serif"],
        "everett-mono": ["TWKEverettMono-Regular", "monospace"],
      },
      borderRadius: {
        none: "0",
      },
      boxShadow: {
        "accent-glow": "0 0 20px rgba(255, 77, 0, 0.3)",
        "accent-glow-lg": "0 0 40px rgba(255, 77, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
