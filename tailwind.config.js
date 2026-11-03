/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0284c7",
        background: "#f0f9ff",
        surface: "#ffffff",
        ink: "#0f172a",
        muted: "#64748b",
        success: "#059669",
        warning: "#d97706",
        danger: "#e11d48",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      boxShadow: { soft: "0 12px 32px rgba(15, 23, 42, 0.06)" },
    },
  },
  plugins: [],
};
