/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1220',
          900: '#0F172A',
          800: '#141F38',
          700: '#1C2B4A'
        },
        gold: {
          400: '#E8C170',
          500: '#D4A94A',
          600: '#B8892E'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 24px 0 rgba(212, 169, 74, 0.15)'
      }
    }
  },
  plugins: []
}
