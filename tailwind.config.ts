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
        haruka: {
          pink: "#FF6B9D",
          light: "#FFB3D1",
          purple: "#C084FC",
          bg: "#FDF0F5",
          card: "#FFF5F8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
