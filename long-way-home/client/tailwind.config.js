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
        },
        game: {
          parchment: '#f5ead8',
          parchDark: '#ecdabc',
          amber: '#c2873a',
          amberDk: '#9a6828',
          green: '#4a7c59',
          red: '#b94040',
          blue: '#4a6890',
          gold: '#c2a84f',
          ink: '#2c1f14',
          inkLt: '#5a4030',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Crimson Pro"', 'Georgia', 'serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      }
    }
  },
  plugins: []
}
