/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E5001C',
        'primary-dark': '#B8001A',
      },
    },
  },
  plugins: [],
};
