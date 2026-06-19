/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          950: '#0A1F2E',
          900: '#0F2B3C',
          800: '#1A3A4F',
          700: '#244A62',
          600: '#2E5A75',
        },
        mint: {
          500: '#00D4AA',
          400: '#00E8BB',
          300: '#33F0CC',
          600: '#00B892',
        },
        warn: {
          red: '#FF4757',
          amber: '#FFA502',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
