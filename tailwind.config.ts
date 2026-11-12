import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f3f7f4",
          100: "#e2ece5",
          200: "#c5d9cb",
          300: "#9dbda7",
          400: "#6f9c80",
          500: "#4f7f62",
          600: "#3d6a4f",
          700: "#325743",
          800: "#2b483a",
          900: "#253d32",
          950: "#122116",
        },
        gold: {
          50: "#fbf8f0",
          100: "#f6edda",
          200: "#ecd9ac",
          300: "#e0c076",
          400: "#d4a94e",
          500: "#c3933a",
          600: "#a8762d",
          700: "#875b26",
          800: "#6f4923",
          900: "#5c3b20",
        },
        sand: {
          50: "#faf8f2",
          100: "#f4f0e5",
          200: "#eae4d3",
          300: "#d9cfb8",
          400: "#c2b294",
          500: "#a99873",
          600: "#8e7d5c",
          700: "#75654a",
          800: "#5f523d",
          900: "#4c4133",
        },
        ink: {
          50: "#f7f6f3",
          100: "#edebe5",
          200: "#dbd8cf",
          300: "#c2bfb4",
          400: "#a39f92",
          500: "#878377",
          600: "#6f6b60",
          700: "#5a5650",
          800: "#484540",
          900: "#383632",
          950: "#211f1c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Fraunces", "Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(33,31,28,0.04), 0 4px 12px rgba(33,31,28,0.06)",
        lift: "0 2px 4px rgba(33,31,28,0.05), 0 12px 28px rgba(33,31,28,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
