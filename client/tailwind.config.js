/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#0f0f23',
          grid: '#1a1a3e',
        },
        node: {
          start: '#10b981',
          end: '#ef4444',
          action: '#3b82f6',
          decision: '#f59e0b',
          parallel: '#8b5cf6',
          loop: '#f97316',
        },
        panel: {
          bg: '#1e1e3f',
          border: '#2d2d5a',
          hover: '#2a2a50',
        }
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
