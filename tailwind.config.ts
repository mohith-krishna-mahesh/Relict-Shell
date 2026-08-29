import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Relict Shell Approved Color Palette
        // Brand Accents
        amber: {
          DEFAULT: '#FCBA48',
          pale: '#FFE49E',
          deep: '#EE8E28',
          rust: '#B25A12',
        },
        // Core Theme Tokens
        ink: '#140D07',
        'bg-light': '#FBF6EE',
        'bg-dark': '#100C08',
        'text-light': '#4A3B2A',
        'text-dark': '#E2D5C3',
        // Semantic
        conflict: '#C4451C',
        // Espresso & Cream scales
        espresso: {
          900: '#100C08',
          800: '#140D07',
          700: '#18130E',
          600: '#201A14',
          500: '#4A3B2A',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FBF6EE',
          200: '#F7F2E9',
          300: '#E2D5C3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        warm: '0 24px 80px rgba(71, 37, 8, 0.12)',
        subtle: '0 2px 8px rgba(20, 13, 7, 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
