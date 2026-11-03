import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#101B35",
          800: "#19243B",
          700: "#223152",
        },
        orange: {
          500: "#FF7547",
          600: "#E55C2F",
        },
        emerald: {
          500: "#18A878",
        },
        slate: {
          50: "#F5F7FB",
        },
      },
    },
  },
  plugins: [],
};
export default config;
