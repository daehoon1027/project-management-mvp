import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bcddff",
          300: "#8fc4ff",
          400: "#5aa2ff",
          500: "#2f7cff",
          600: "#1d5fe6",
          700: "#194dba",
          800: "#1b438f",
          900: "#1d3d70",
        },
      },
      boxShadow: {
        soft: "0 18px 40px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(47,124,255,0.16), transparent 34%), radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 28%)",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "\"Segoe UI\"",
          "\"Apple SD Gothic Neo\"",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
