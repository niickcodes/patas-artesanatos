/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF9',
          100: '#FAF6F0',
          200: '#F5ECE1',
          300: '#EDE0CF',
        },
        pastel: {
          peach: '#FFE5D9',
          peachDark: '#F7A789',
          coral: '#F69479',
          terracotta: '#D9735E',
          mint: '#D8EEDC',
          mintDark: '#9BCBB0',
          sage: '#B5CFB8',
          rose: '#FBE4EC',
          roseDark: '#F48FB1',
          lavender: '#EAE4F5',
          lavenderDark: '#BAA3E4',
          honey: '#FDEFD6',
          honeyDark: '#E6A74E',
        },
        charcoal: {
          DEFAULT: '#373030',
          muted: '#6E6260',
          light: '#A39694',
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'Outfit', 'system-ui', 'sans-serif'],
        display: ['Comfortaa', 'Quicksand', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'soft-hover': '0 16px 36px rgba(230, 167, 78, 0.12)',
        'card': '0 10px 25px -5px rgba(61, 49, 48, 0.05), 0 8px 10px -6px rgba(61, 49, 48, 0.03)',
        'card-hover': '0 20px 35px -5px rgba(246, 148, 121, 0.18), 0 10px 15px -5px rgba(61, 49, 48, 0.05)',
      },
      animation: {
        'bounce-gentle': 'bounceGentle 2.5s infinite ease-in-out',
        'float': 'float 4s infinite ease-in-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1.5deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.04)' },
        }
      }
    },
  },
  plugins: [],
}
