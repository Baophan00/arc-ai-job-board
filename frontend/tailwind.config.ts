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
      sm:      "8px",
      DEFAULT: "12px",
      md:      "12px",
      lg:      "16px",
      xl:      "20px",
      "2xl":   "16px",
      "3xl":   "24px",
      "4xl":   "32px",
      full:    "9999px",
    },
    extend: {
      colors: {
        // ── Neumorphic palette ───────────────────────────────────────────────
        neu: {
          base:    "#E0E5EC",
          dark:    "#3D4852",
          muted:   "#6B7280",
          accent:  "#6C63FF",
          "accent-light": "#8B84FF",
          success: "#38B2AC",
        },
        // ── Backward compat — map old names to neu values ────────────────────
        primary:   { DEFAULT: "#6C63FF", 500: "#6C63FF", 600: "#5B52EE" },
        secondary: { DEFAULT: "#38B2AC", 500: "#38B2AC" },
        accent:    { DEFAULT: "#6C63FF", 500: "#6C63FF" },
        blue:  { 50: "#EEEEFF", 100: "#DDDDFB", 200: "#CCCBF7", 300: "#ABAAF2",
                 400: "#8B84FF", 500: "#6C63FF", 600: "#5B52EE", 700: "#4A41DD" },
        emerald: { 500: "#38B2AC", 600: "#2C9A95" },
        amber:   { 500: "#F59E0B", 600: "#D97706" },
        violet:  { 500: "#6C63FF", 600: "#5B52EE" },
        gray:    {
          50:  "#EEF2F7", 100: "#E0E5EC", 200: "#CDD5E0", 300: "#B0BBC9",
          400: "#8B95A5", 500: "#6B7280", 600: "#4B5563", 700: "#374151",
          800: "#1F2937", 900: "#3D4852",
        },
        muted: { DEFAULT: "#E0E5EC", foreground: "#6B7280" },
        surface: { DEFAULT: "#E0E5EC", 2: "#EEF2F7", 3: "#CDD5E0" },
        border:       "transparent",
        destructive:  "#EF4444",
        // Backward compat
        term:  { DEFAULT: "#6C63FF" },
        arc:   { 500: "#6C63FF", 600: "#5B52EE" },
        cyber: { 500: "#6C63FF" },
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        sans:    ["var(--font-dm-sans)",      "DM Sans",           "sans-serif"],
        mono:    ["var(--font-dm-sans)",      "DM Sans",           "sans-serif"],
      },
      boxShadow: {
        // ── Neumorphic shadows ───────────────────────────────────────────────
        neu:               "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)",
        "neu-hover":       "12px 12px 20px rgb(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)",
        "neu-sm":          "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)",
        "neu-xs":          "3px 3px 6px rgb(163,177,198,0.5), -3px -3px 6px rgba(255,255,255,0.4)",
        "neu-inset":       "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)",
        "neu-inset-deep":  "inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)",
        "neu-inset-sm":    "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)",
        "neu-accent":      "9px 9px 16px rgba(108,99,255,0.35), -9px -9px 16px rgba(255,255,255,0.5)",
        "neu-accent-hover":"12px 12px 20px rgba(108,99,255,0.45), -12px -12px 20px rgba(255,255,255,0.6)",
        // Backward compat — no-op (neumorphism uses class-level shadows)
        "term": "none", "term-lg": "none", "card": "none",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        cursorBlink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
      },
      animation: {
        float:      "float 3s ease-in-out infinite",
        "slide-up": "slide-up 0.25s ease-out",
        "fade-in":  "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
