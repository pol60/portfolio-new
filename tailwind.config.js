/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          600: '#6366f1',
          700: '#4f46e5',
          800: '#4338ca',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [],
} 