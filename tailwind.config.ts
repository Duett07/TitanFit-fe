import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          surface: "var(--card-surface)",
          hover: "var(--card-hover)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        subtle: {
          foreground: "var(--subtle-foreground)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        success: {
          DEFAULT: "var(--success)",
          bg: "var(--success-bg)",
          border: "var(--success-border)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          bg: "var(--warning-bg)",
          border: "var(--warning-border)",
        },
        destructive: "var(--destructive)",
      },
      fontFamily: {
        heading: ["var(--font-outfit)", "sans-serif"],
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        sm: "var(--radius-sm, 4px)",
        DEFAULT: "var(--radius-md, 6px)",
        md: "var(--radius-md, 6px)",
        lg: "var(--radius-lg, 10px)",
        xl: "var(--radius-xl, 14px)",
        "2xl": "var(--radius-2xl, 16px)",
        "3xl": "24px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
