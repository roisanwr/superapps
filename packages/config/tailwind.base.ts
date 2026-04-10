/** @type {import('tailwindcss').Config} */
const tailwindBase = {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        primary: "oklch(var(--color-primary) / <alpha-value>)",
        "primary-hover": "oklch(var(--color-primary-hover) / <alpha-value>)",
        surface: "oklch(var(--color-surface) / <alpha-value>)",
        "surface-alt": "oklch(var(--color-surface-alt) / <alpha-value>)",
        "surface-elevated": "oklch(var(--color-surface-elevated) / <alpha-value>)",
        text: "oklch(var(--color-text) / <alpha-value>)",
        "text-muted": "oklch(var(--color-text-muted) / <alpha-value>)",
        border: "oklch(var(--color-border) / <alpha-value>)",
        success: "oklch(var(--color-success) / <alpha-value>)",
        warning: "oklch(var(--color-warning) / <alpha-value>)",
        danger: "oklch(var(--color-danger) / <alpha-value>)",
      },
      borderRadius: {
        DEFAULT: "var(--radius-base)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "9999px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};

export default tailwindBase;
