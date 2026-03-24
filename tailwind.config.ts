import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-syne)", "system-ui", "sans-serif"],
        mono:  ["var(--font-mono)", "Courier New", "monospace"],
      },
      colors: {
        accent:  "hsl(var(--accent))",
        bg:      "hsl(var(--bg))",
        border:  "hsl(var(--border))",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
