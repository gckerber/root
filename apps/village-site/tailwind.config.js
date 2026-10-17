/** @type {import('tailwindcss').Config} */
const step = (n) => `rgb(var(--blue-${n}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Re-pointed at the active season's brand color (see src/theme/seasons.js)
        blue: {
          50: step(50), 100: step(100), 200: step(200), 300: step(300), 400: step(400),
          500: step(500), 600: step(600), 700: step(700), 800: step(800), 900: step(900), 950: step(950),
        },
        village: {
          blue: '#1e3a8a',
          gold: '#fbbf24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}