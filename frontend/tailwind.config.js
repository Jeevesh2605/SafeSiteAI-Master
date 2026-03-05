// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,122,0,0.4)' },
          '50%':      { boxShadow: '0 0 40px rgba(255,122,0,0.8)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s infinite',
      },
    },
  },
  plugins: [],
}

