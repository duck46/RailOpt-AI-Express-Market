/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        via: {
          yellow:   "#FFCC00",
          yellowHover: "#e6b800",
          charcoal: "#4B4F54",
          black:    "#111111",
          bg:       "#F5F5F5",
          surface:  "#FFFFFF",
          border:   "#E8E8E8",
          muted:    "#9ca3af",
          text:     "#111111",
          subtext:  "#6b7280",
        },
      },
    },
  },
  plugins: [],
};
