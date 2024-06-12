import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["-apple-system", "BlinkMacSystemFont", "sans-serif"],
      serif: ["-apple-system-ui-serif", "ui-serif", "Georgia", "serif"],
      mono: [
        "ui-monospace",
        "SFMono-Regular",
        "ui-monospace",
        "Monaco",
        "Andale Mono",
        "Ubuntu Mono",
        "monospace",
      ],
    },
    extend: {},
  },
  plugins: [],
} satisfies Config;
