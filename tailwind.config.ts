import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        night: "#060816",
        ink: "#0f172a",
        glow: "#5eead4",
        roseglass: "#fb7185"
      },
      boxShadow: {
        glass: "0 20px 80px rgba(15, 23, 42, 0.45)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(94,234,212,0.14), transparent 40%), radial-gradient(circle at 80% 20%, rgba(251,113,133,0.18), transparent 35%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.12), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
