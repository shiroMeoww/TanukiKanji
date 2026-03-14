/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Jasne kolory inspirowane WaniKani
        'tanuki': {
          50: '#fef3f2',
          100: '#fee5e2',
          200: '#fdcfc9',
          300: '#fbaea4',
          400: '#f77f70',
          500: '#ed5a47',
          600: '#da3e28',
          700: '#b8301e',
          800: '#982b1c',
          900: '#7e291d',
        },
        'radical': {
          light: '#86D7F7',
          DEFAULT: '#0AF',
          dark: '#0088CC',
        },
        'kanji': {
          light: '#FFA6D9',
          DEFAULT: '#FF00AA',
          dark: '#DD0099',
        },
        'vocabulary': {
          light: '#C99DFF',
          DEFAULT: '#AA00FF',
          dark: '#8800DD',
        },
      },
    },
  },
  plugins: [],
}
