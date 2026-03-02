/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        trail: {
          tan: '#D4A574',
          brown: '#8B6914',
          darkBrown: '#5C4033',
          blue: '#4A7C9B',
          darkBlue: '#2C4A5E',
          green: '#5B8C3E',
          red: '#C44536',
          gold: '#D4A017',
          cream: '#FFF8E7',
          parchment: '#F5E6C8'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        display: ['Georgia', 'serif']
      }
    }
  },
  plugins: []
}
