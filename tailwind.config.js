/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0E0C09',
        cream: '#F2EAD8',
        gold: '#C8A84B',
        text: 'rgb(var(--app-text-rgb) / <alpha-value>)',
        'app-bg': 'rgb(var(--app-bg-rgb) / <alpha-value>)',
        'app-text': 'rgb(var(--app-text-rgb) / <alpha-value>)',
        'app-sep': 'rgb(var(--app-sep-rgb) / <alpha-value>)',
        'app-card-bg': 'rgb(var(--app-card-bg-rgb) / <alpha-value>)',
        'app-line': 'rgb(var(--app-line-rgb) / <alpha-value>)',
        'app-muted': 'rgb(var(--app-muted-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      keyframes: {
        spotlight: {
          '0%': {
            opacity: '0',
            transform: 'translate(-72%, -62%) scale(0.55)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, -40%) scale(1)',
          },
        },
      },
      animation: {
        spotlight: 'spotlight 2.2s ease 0.4s 1 forwards',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}

