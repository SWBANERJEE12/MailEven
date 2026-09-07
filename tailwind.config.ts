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
        // MailEven Phase 2 Color Tokens
        charcoal: "#4C4C4C",
        indigo: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
          border: "var(--accent-border)",
        },
        stardust: {
          DEFAULT: "#A78D78",
          light: "rgba(167, 141, 120, 0.15)",
        },
        foggy: "#E5E5E5",
        midgrey: "#756C66",
        steelteal: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
        },

        // Dynamic theme-aware semantic tokens
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
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
