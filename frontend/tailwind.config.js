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
          yellowDim:"#CC9900",
          charcoal: "#4B4F54",
          black:    "#000000",
          white:    "#FFFFFF",
          // Dark UI surfaces built on charcoal
          bg:       "#0f1011",   // near-black base
          surface:  "#1a1c1e",   // slightly lighter panel
          panel:    "#23262a",   // card surface
          border:   "#2e3135",   // subtle border
          muted:    "#7a7f85",   // muted text
        },
      },
      boxShadow: {
        via:    "0 0 24px rgba(255, 204, 0, 0.12)",
        "via-lg":"0 0 48px rgba(255, 204, 0, 0.18)",
      },
    },
  },
  plugins: [],
};
