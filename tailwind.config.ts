import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss:      "#0F172A",
        "deep-slate": "#1E293B",
        slate:      "#334155",
        "muted-slate": "#475569",
        "ghost-white": "#F8FAFC",

        "text-primary":   "#F8FAFC",
        "text-secondary": "#94A3B8",
        "text-muted":     "#64748B",

        "neon-cyan":   "#22D3EE",
        "neon-violet": "#A78BFA",
        "neon-amber":  "#F59E0B",
        "neon-emerald":"#34D399",
        "neon-rose":   "#F87171",

        "state-info":    "#22D3EE",
        "state-success": "#34D399",
        "state-warning": "#FBBF24",
        "state-error":   "#F87171",
        "state-accent":  "#A78BFA",
      },

      fontFamily: {
        display: ["var(--font-geist-mono)", "monospace"],
        body:    ["var(--font-inter)", "sans-serif"],
        code:    ["var(--font-jetbrains-mono)", "monospace"],
      },

      fontSize: {
        "xs":      ["11px", { lineHeight: "16px" }],
        "sm":      ["13px", { lineHeight: "20px" }],
        "base":    ["15px", { lineHeight: "24px" }],
        "lg":      ["18px", { lineHeight: "28px" }],
        "xl":      ["24px", { lineHeight: "32px" }],
        "2xl":     ["32px", { lineHeight: "40px" }],
        "display": ["48px", { lineHeight: "56px" }],
        "hero":    ["64px", { lineHeight: "72px" }],
      },

      borderRadius: {
        sm:   "4px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        full: "9999px",
      },

      spacing: {
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "40px",
      },

      boxShadow: {
        "glow-cyan":    "0 0 12px #22D3EE",
        "glow-violet":  "0 0 12px #A78BFA",
        "glow-amber":   "0 0 12px #F59E0B",
        "glow-emerald": "0 0 12px #34D399",
        "glow-rose":    "0 0 12px #F87171",
        "glow-cyan-lg": "0 0 24px #22D3EE",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "noise": "url('/noise.png')",
      },

      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
        "dash-flow": {
          "0%":   { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-8px)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "dash-flow":  "dash-flow 0.6s ease-out forwards",
        "float":      "float 3s ease-in-out infinite",
        "shimmer":    "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;