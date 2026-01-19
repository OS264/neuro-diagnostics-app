/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Root Fix: This tells Tailwind to look at your React files
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

