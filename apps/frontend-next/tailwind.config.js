/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-inter)'],
      },
      colors: {
        background: '#05080F',
        surface: '#0A0F1D',
        surfaceHover: '#111827',
        primary: '#1F7EDC',
        primaryHover: '#1766B5',
        secondary: '#FF6A2A',
        secondaryHover: '#E5581F',
        border: '#1f2937',
        textMain: '#f8fafc',
        textMuted: '#94a3b8'
      },
      boxShadow: {
        'glow': '0 0 15px rgba(31, 126, 220, 0.4)',
        'glow-secondary': '0 0 15px rgba(255, 106, 42, 0.4)',
      }
    },
  },
  plugins: [],
}
