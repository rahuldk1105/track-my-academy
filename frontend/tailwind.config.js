/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#111827', // A deep, dark charcoal
        'secondary': '#1F2937', // A slightly lighter gray for cards/sections
        'accent': '#38BDF8',   // A clean, vibrant blue for accents
        'text-primary': '#F3F4F6', // Off-white for primary text
        'text-secondary': '#9CA3AF', // A muted gray for secondary text
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'], // Main body font
        heading: ['Inter', 'sans-serif'], // For powerful headings
      },
    },
  },
  plugins: [],
}
