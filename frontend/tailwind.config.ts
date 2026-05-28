import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    borderRadius: {
      none:    "0px",
      sm:      "4px",
      DEFAULT: "6px",
      md:      "6px",
      lg:      "8px",
      xl:      "12px",
      "2xl":   "16px",
      "3xl":   "24px",
      full:    "9999px",
    },
    extend: {
      colors: {
        // ── Primary palette ─────────────────────────────────────────────────
        primary: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          DEFAULT: "#3B82F6",
        },
        // ── Secondary / Emerald ─────────────────────────────────────────────
        secondary: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          DEFAULT: "#10B981",
        },
        // ── Accent / Amber ──────────────────────────────────────────────────
        accent: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          DEFAULT: "#F59E0B",
        },
        // ── Neutral ─────────────────────────────────────────────────────────
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        // ── Semantic ────────────────────────────────────────────────────────
        destructive: "#EF4444",
        border: "#E5E7EB",
        // ── Backward compat aliases (terminal styles no longer used) ─────────
        term: {
          DEFAULT: "#3B82F6",
          bright:  "#60A5FA",
          dim:     "#93C5FD",
          dark:    "#EFF6FF",
        },
        amber: {
          DEFAULT: "#F59E0B",
          dim:     "#FEF3C7",
        },
        err: "#EF4444",
        surface: {
          DEFAULT: "#FFFFFF",
          2:       "#F9FAFB",
          3:       "#F3F4F6",
          4:       "#E5E7EB",
        },
        arc: {
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          950: "#1E3A8A",
        },
        cyber: {
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Outfit", "Inter", "sans-serif"],
        mono: ["var(--font-outfit)", "Outfit", "Inter", "sans-serif"],
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease-out",
        "slide-up":  "slideUp 0.25s ease-out",
        "blink":     "cursorBlink 1s step-end infinite",
        "pulse-arc": "pulse 2s ease-in-out infinite",
        "scan":      "fadeIn 0.2s ease-out", // compat noop
        "glitch":    "fadeIn 0.2s ease-out", // compat noop
        "glow":      "pulse 2s ease-in-out infinite",
        "blink-slow":"cursorBlink 1.4s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        cursorBlink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
      },
      boxShadow: {
        // No shadows in the new design system
        "term":    "none",
        "term-lg": "none",
        "amber":   "none",
        "arc":     "none",
        "cyber":   "none",
        "card":    "none",
      },
    },
  },
  plugins: [],
};

export default config;
