import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic design tokens strictly adhering to DESIGN.md
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          base: "var(--surface-base)",
          card: "var(--surface-card)",
          elevated: "var(--surface-elevated)",
          highlight: "var(--surface-highlight)",
          border: "var(--surface-border)",
          borderSubtle: "var(--surface-border-subtle)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
          border: "var(--accent-border)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          light: "var(--muted-light)",
          dark: "var(--muted-dark)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Newsreader", "Charter", "Georgia", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
