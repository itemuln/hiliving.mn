/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff4f3',
          100: '#ffe5e3',
          400: '#ff716b',
          500: '#f7554e',
          600: '#e8423c',
        },
        ink: '#444444',
      },
      boxShadow: {
        soft: '0 12px 35px rgba(50, 50, 50, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
