/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F1320',
          900: '#0B0E17',
          800: '#12162294',
          700: '#1A1F2E',
          600: '#232941',
          500: '#323a58',
        },
        paper: {
          DEFAULT: '#F4EEDD',
          dim: '#E9E1CB',
        },
        stamp: {
          DEFAULT: '#FF4B6E',
          dark: '#D6314F',
          light: '#FF7C93',
        },
        marker: {
          DEFAULT: '#FFC53D',
          dark: '#E8A400',
        },
        mint: {
          DEFAULT: '#38D6A7',
          dark: '#1FAE85',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        'perforation': 'radial-gradient(circle, transparent 4px, currentColor 4.5px, currentColor 5px, transparent 5.5px)',
      },
      boxShadow: {
        ticket: '0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 30px -12px rgba(0,0,0,0.55)',
        stamp: '0 6px 18px -6px rgba(255,75,110,0.55)',
      },
      keyframes: {
        stampIn: {
          '0%': { transform: 'scale(2.2) rotate(-14deg)', opacity: '0' },
          '55%': { transform: 'scale(0.92) rotate(-6deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-6deg)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fillBar: {
          '0%': { width: '0%' },
        },
      },
      animation: {
        stampIn: 'stampIn 260ms cubic-bezier(.2,1.4,.4,1)',
        popIn: 'popIn 180ms ease-out',
      },
    },
  },
  plugins: [],
};
