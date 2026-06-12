import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg1: "#0d1b3e", bg2: "#1a3a6e", accent: "#2563eb",
        sky: "#7eb8f7", paper: "#f8f9fa", ink: "#0d1b3e", gold: "#f5c85a"
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        anton: ["var(--font-anton)", "sans-serif"],
        space: ["var(--font-space)", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
