/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        lg: "1200px",
      },
    },
    extend: {
      colors: {
        // Design tokens
        "brand-blue": "#3B82F6",
        "gray-900": "#1F2937",
        "gray-500": "#6B7280",
        "gray-100": "#F3F4F6",
        "status-excellent": "#10B981",
        "status-fair": "#F59E0B",
        "status-poor": "#EF4444",
        // Semantic aliases
        primary: "#3B82F6",
        accent: "#10B981",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
};
