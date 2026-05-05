import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07070a",
          900: "#0a0a0b",
          850: "#101014",
          800: "#17171d",
          700: "#1f2028",
          600: "#2a2b34",
          500: "#3a3b45",
          400: "#6b6c78",
          300: "#a0a1ab",
          200: "#cfd0d6",
          100: "#ececef",
        },
        amber: {
          DEFAULT: "#d4a574",
          soft: "#f0d5b0",
          deep: "#a97c4a",
        },
        crimson: "#d14e4e",
        sage: "#7fb28a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "scrim-bottom":
          "linear-gradient(180deg, rgba(10,10,11,0) 0%, rgba(10,10,11,0.6) 55%, rgba(10,10,11,0.98) 100%)",
        "scrim-left":
          "linear-gradient(90deg, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.65) 45%, rgba(10,10,11,0) 100%)",
        grain:
          "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.08 0 0 0 0 0.08 0 0 0 0 0.1 0 0 0 0.35 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
