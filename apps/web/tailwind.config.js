/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#00153d",
        "on-primary": "#ffffff",
        "primary-container": "#002867",
        "on-primary-container": "#6390f6",
        secondary: "#006d43",
        "secondary-container": "#75f8b3",
        "on-secondary-container": "#007147",
        tertiary: "#13005a",
        "tertiary-container": "#240093",
        "on-tertiary-container": "#8f82ff",
        surface: "#f7f9fb",
        "surface-container-low": "#f2f4f6",
        "surface-container-high": "#e6e8ea",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#191c1e",
        "on-surface-variant": "#43474f",
        "outline-variant": "#c4c6d0",
        error: "#ba1a1a",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
