/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pl: {
          purple: '#37003c',
          'purple-dark': '#240027',
          'purple-deep': '#140016',
          'purple-light': '#510258',
          'purple-surface': '#2e0232',
          card: '#29022d',
          'card-hover': '#3b0641',
          'card-border': '#4e0c56',
          green: '#00ff87',
          'green-dark': '#00cc6a',
          magenta: '#e90052',
          cyan: '#04f5ff',
          yellow: '#ffe600',
          gray: {
            100: '#f4f4f6',
            200: '#e2e2e7',
            300: '#b8b8c2',
            400: '#8e8e9c',
            500: '#646473',
            600: '#484855',
            700: '#32323e',
            800: '#202029',
            900: '#121218',
          }
        },
        pitch: {
          dark: '#135227',
          light: '#17612e',
          line: 'rgba(255, 255, 255, 0.42)',
          spot: 'rgba(255, 255, 255, 0.55)',
        },
        emerald: {
          50: '#f2f8f5',
          100: '#dfeee7',
          200: '#c1ddd1',
          300: '#95c4b1',
          400: '#68a990',
          500: '#498e75',
          600: '#38725d',
          700: '#2e5c4c',
          800: '#274a3e',
          900: '#213d34',
          950: '#11221c',
        },
        rose: {
          50: '#faf4f4',
          100: '#f4e6e7',
          200: '#ead0d3',
          300: '#dab0b5',
          400: '#c4868e',
          500: '#ad656e',
          600: '#934e57',
          700: '#7b4048',
          800: '#67373e',
          900: '#583137',
          950: '#30171b',
        },
        amber: {
          50: '#faf8f2',
          100: '#f3ede0',
          200: '#e6d9bf',
          300: '#d5bf96',
          400: '#c4a56e',
          500: '#b08d52',
          600: '#967340',
          700: '#7b5b35',
          800: '#664b2f',
          900: '#553e29',
          950: '#2f2014',
        },
        sky: {
          50: '#f3f7fa',
          100: '#e4edf4',
          200: '#c9dbe9',
          300: '#a3c2d9',
          400: '#78a3c3',
          500: '#5987ac',
          600: '#466d8f',
          700: '#3a5975',
          800: '#334b62',
          900: '#2d4053',
          950: '#1c2936',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Impact', 'Arial Black', 'Trebuchet MS', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(0, 255, 135, 0.4)',
        'glow-magenta': '0 0 15px rgba(233, 0, 82, 0.4)',
        'glow-cyan': '0 0 15px rgba(4, 245, 255, 0.4)',
      },
      animation: {
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-sub': 'pulseSub 1.5s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0.8' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSub: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(0, 255, 135, 0.7)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 8px rgba(0, 255, 135, 0)' },
        }
      }
    },
  },
  plugins: [],
}
