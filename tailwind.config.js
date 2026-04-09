/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
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

