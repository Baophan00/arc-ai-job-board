import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // ── Zero radius everywhere (terminal aesthetic) ─────────────────────────
    borderRadius: {
      none:    "0px",
      sm:      "0px",
      DEFAULT: "0px",
      md:      "0px",
      lg:      "0px",
      xl:      "0px",
      "2xl":   "0px",
      "3xl":   "0px",
      full:    "9999px", // keep only for dot indicators
    },
    extend: {
      colors: {
        // ── Terminal green palette ──────────────────────────────────────────
        term: {
          DEFAULT: "#33ff00",   // phosphor green — primary
          bright:  "#66ff33",   // brighter on hover
          dim:     "#1f521f",   // muted: borders, inactive text
          dark:    "#0d1a0d",   // very dark green tint
        },
        // ── Amber secondary ─────────────────────────────────────────────────
        amber: {
          DEFAULT: "#ffb000",
          dim:     "#4a3300",
        },
        // ── Error red ───────────────────────────────────────────────────────
        err: "#ff3333",
        // ── Surfaces ────────────────────────────────────────────────────────
        surface: {
          DEFAULT: "#0a0a0a",
          2:       "#0e0e0e",
          3:       "#111111",
          4:       "#141414",
        },
        // ── Backward compat aliases (detail pages not yet rewritten) ────────
        arc: {
          300: "#66ff33",
          400: "#33ff00",
          500: "#33ff00",
          600: "#29cc00",
          950: "#0d1a0d",
        },
        cyber: {
          400: "#33ff00",
          500: "#33ff00",
          600: "#29cc00",
        },
      },
      fontFamily: {
        sans: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "blink":       "cursorBlink 1s step-end infinite",
        "blink-slow":  "cursorBlink 1.4s step-end infinite",
        "glitch":      "glitch 0.4s ease-in-out",
        "fade-in":     "fadeIn 0.2s ease-out",
        "slide-up":    "slideUp 0.3s ease-out",
        "glow":        "glowPulse 2s ease-in-out infinite alternate",
        "pulse-arc":   "cursorBlink 2s step-end infinite", // compat
        "scan":        "scan 8s linear infinite",
      },
      keyframes: {
        cursorBlink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
        glitch: {
          "0%":   { transform: "translate(0)",       filter: "none"                   },
          "20%":  { transform: "translate(-2px,1px)", filter: "hue-rotate(90deg)"     },
          "40%":  { transform: "translate(2px,-1px)", filter: "none"                  },
          "60%":  { transform: "translate(-1px,0px)", filter: "hue-rotate(270deg)"    },
          "80%":  { transform: "translate(1px,1px)",  filter: "none"                  },
          "100%": { transform: "translate(0)",       filter: "none"                   },
        },
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          from: { textShadow: "0 0 4px rgba(51,255,0,0.4)" },
          to:   { textShadow: "0 0 14px rgba(51,255,0,0.85), 0 0 24px rgba(51,255,0,0.3)" },
        },
        scan: {
          "0%":   { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100%" },
        },
      },
      boxShadow: {
        "term":     "0 0 8px rgba(51, 255, 0, 0.25)",
        "term-lg":  "0 0 20px rgba(51, 255, 0, 0.15), 0 0 40px rgba(51, 255, 0, 0.07)",
        "amber":    "0 0 8px rgba(255, 176, 0, 0.25)",
        "arc":      "0 0 8px rgba(51, 255, 0, 0.25)",   // compat
        "cyber":    "0 0 8px rgba(51, 255, 0, 0.25)",   // compat
        "card":     "0 2px 8px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
