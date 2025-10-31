/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5E9FF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          300: '#C084FC',
          400: '#A855F7',
          500: '#9333EA',
          600: '#7E22CE',
          700: '#6B21A8',
          800: '#581C87',
          900: '#3B0764',
          950: '#210033',
        },
      },
      ringColor: {
        DEFAULT: '#7E22CE', // primary-600
      },
      ringOpacity: {
        DEFAULT: '0.25',
      },
      ringOffsetWidth: {
        DEFAULT: '0px',
      },
      ringWidth: {
        DEFAULT: '3.2px', // 0.2rem
      },
    },
  },
  plugins: [],
};
