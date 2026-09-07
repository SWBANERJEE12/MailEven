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
        background: "#000000",
        foreground: "#EDEDED",
        accent: {
          DEFAULT: "#FE4401",
          hover: "#E03C00",
          light: "rgba(254, 68, 1, 0.15)",
          border: "rgba(254, 68, 1, 0.35)",
        },
        surface: {
          base: "#0A0A0A",
          card: "#121212",
          elevated: "#181818",
          highlight: "#222222",
          border: "#262626",
          borderSubtle: "#1C1C1C",
        },
        muted: {
          DEFAULT: "#8A8A8E",
          light: "#A1A1AA",
          dark: "#52525B",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
export default config;
