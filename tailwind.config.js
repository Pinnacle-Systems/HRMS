/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      colors: {
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        "primary-light": "var(--color-primary-light)",
        "primary-100": "var(--color-primary-100)",
        "primary-50": "var(--color-primary-50)",
        secondary: "#64748b",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        head: "var(--head)",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        blink: "blink 1s infinite",
      },
      // colors: {
      //   primary: "#e16a3d",
      //   "primary-dark": "#c95a32",
      //   "primary-light":"#fb923c",
      //   "primary-100":"#ffedd5",
      //   "primary-50":"#fff7ed",
      //   secondary: "#64748b",
      //   success: "#10b981",
      //   warning: "#f59e0b",
      //   error: "#ef4444",
      // },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      addUtilities({
        // Backgrounds - Light to Dark mapping
        ".dark .bg-gray-50": { backgroundColor: theme("colors.gray.900") },
        ".dark .bg-gray-100": { backgroundColor: theme("colors.gray.600") },
        ".dark .bg-gray-200": { backgroundColor: theme("colors.gray.700") },
        ".dark .bg-gray-300": { backgroundColor: theme("colors.gray.600") },
        ".dark .bg-white": { backgroundColor: theme("colors.gray.800") },
        ".dark .bg-white-50": { backgroundColor: theme("colors.gray.900") },
        ".dark .bg-primary-50": { backgroundColor: theme("colors.gray.800") },

        // Texts
        ".dark .text-gray-400": { color: theme("colors.gray.100") },
        ".dark .text-gray-500": { color: theme("colors.gray.100") },
        ".dark .text-gray-600": { color: theme("colors.gray.300") },
        ".dark .text-gray-700": { color: theme("colors.gray.200") },
        ".dark .text-gray-800": { color: theme("colors.gray.100") },
        ".dark .text-gray-900": { color: theme("colors.gray.50") },
        ".dark .text-white": { color: theme("colors.gray.100") },

        // Ring
        ".dark .ring-gray-400": {
          "--tw-ring-color": "var(--color-primary-dark)",
        },

        ".dark .ring-2": { "--tw-ring-offset-color": "#333030" },

        // // Ring offset
        // ".dark .ring-offset-gray-100": {
        //   "--tw-ring-offset-color": "var(--gray-800)",
        // },
        // ".dark .ring-offset-white": {
        //   "--tw-ring-offset-color": "var(--gray-800)",
        //   // "--tw-ring-offset-shadow" : "var(--gray-800)",
        // },

        // Borders
        ".dark .border-gray-200": { borderColor: theme("colors.gray.700") },
        ".dark .border-gray-300": { borderColor: theme("colors.gray.600") },

        // Gradients - Fixed typo: 'colors-primary-dark' -> 'color-primary-dark'
        ".dark .from-primary-50": {
          "--tw-gradient-from": "var(--color-primary-dark)",
          "--tw-gradient-to": "transparent",
          "--tw-gradient-stops":
            "var(--tw-gradient-from), var(--tw-gradient-to)",
        },
        ".dark .to-gray-100": {
          "--tw-gradient-stops":
            "var(--tw-gradient-from), var(--tw-gradient-to)",
        },
      });
    },
  ],
};
