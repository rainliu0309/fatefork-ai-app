import type { Config } from "tailwindcss";

/**
 * Fate Fork's quiet deep-space palette. Semantic names keep both symbolic
 * systems visually equal and prevent "good/bad" color coding.
 */
export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#080b16",
          900: "#0d1222",
          850: "#12182a",
          800: "#172034",
        },
        mist: {
          100: "#eeedf6",
          200: "#d8d7e7",
          300: "#bbb9d1",
          400: "#9793b3",
          500: "#74708f",
          600: "#56526d",
        },
        haze: {
          purple: "#aaa0c8",
          cyan: "#9bc6c9",
          champagne: "#d7c8ae",
          silver: "#cbd1dc",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
      },
      boxShadow: {
        glass:
          "0 28px 80px rgba(2, 5, 15, .28), inset 0 1px 0 rgba(255,255,255,.08)",
        glow: "0 0 48px rgba(155, 198, 201, .12)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "soft-float": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-8px,0)" },
        },
        "slow-drift": {
          "0%": { transform: "translate3d(-2%, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(2%, -1%, 0) scale(1.03)" },
          "100%": { transform: "translate3d(-2%, 0, 0) scale(1)" },
        },
        "line-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        breathe: {
          "0%, 100%": { opacity: ".45", transform: "scale(.98)" },
          "50%": { opacity: ".8", transform: "scale(1.02)" },
        },
      },
      animation: {
        "soft-float": "soft-float 8s ease-in-out infinite",
        "slow-drift": "slow-drift 18s ease-in-out infinite",
        "line-flow": "line-flow 10s linear infinite",
        shimmer: "shimmer 3.5s ease-in-out infinite",
        breathe: "breathe 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
