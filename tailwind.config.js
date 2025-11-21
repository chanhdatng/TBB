/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F5132', // A nice bakery green
          light: '#198754',
          dark: '#0B3D26',
        },
        secondary: '#F8F9FA',
        accent: '#D1E7DD',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
