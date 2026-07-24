/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ── Color tokens ────────────────────────────────────────────
      // Every color used in TSX must reference one of these, never a
      // raw Tailwind swatch (no `text-indigo-400`, `bg-zinc-900`, etc).
      colors: {
        mb: {
          bg: "var(--mb-bg)",
          "bg-raised": "var(--mb-bg-raised)",
          surface: "var(--mb-surface)",
          "surface-hover": "var(--mb-surface-hover)",
          "surface-active": "var(--mb-surface-active)",
          border: "var(--mb-border)",
          "border-hover": "var(--mb-border-hover)",
          "border-focus": "var(--mb-border-focus)",
          text: "var(--mb-text)",
          "text-secondary": "var(--mb-text-secondary)",
          "text-tertiary": "var(--mb-text-tertiary)",
          "text-disabled": "var(--mb-text-disabled)",
          accent: "var(--mb-accent)",
          "accent-muted": "var(--mb-accent-muted)",
          key: "var(--mb-syntax-key)",
          string: "var(--mb-syntax-string)",
          bracket: "var(--mb-syntax-bracket)",
          number: "var(--mb-syntax-number)",
          success: "var(--mb-success)",
          error: "var(--mb-error)",
        },
      },

      // ── Typography ──────────────────────────────────────────────
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "SF Pro Display",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "SF Mono",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter: "-0.025em",
        tight: "-0.02em",
      },

      // ── Radius — capped, never rounded-3xl/full on containers ──
      borderRadius: {
        sm: "5px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
      },

      // ── Elevation — hairline borders + soft shadow, no glow ────
      boxShadow: {
        "mb-sm": "0 1px 2px 0 rgb(0 0 0 / 0.4)",
        "mb-md": "0 4px 12px -2px rgb(0 0 0 / 0.5), 0 0 0 1px rgb(255 255 255 / 0.04)",
        "mb-panel": "0 1px 0 0 rgb(255 255 255 / 0.03) inset",
        "mb-focus": "0 0 0 1px var(--mb-border-focus)",
      },

      backgroundImage: {
        // Faint 1px grid, used at ~3% opacity — texture, not a spotlight.
        "mb-grid":
          "linear-gradient(to right, rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        "mb-grid": "32px 32px",
      },

      transitionDuration: {
        120: "120ms",
      },

      keyframes: {
        "mb-fade-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "mb-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "mb-fade-up": "mb-fade-up 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "mb-blink": "mb-blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
