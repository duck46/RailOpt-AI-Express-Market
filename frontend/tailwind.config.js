/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        amber: "0 0 20px rgba(245, 158, 11, 0.15)",
        "amber-lg": "0 0 40px rgba(245, 158, 11, 0.2)",
      },
    },
  },
  plugins: [],
};
