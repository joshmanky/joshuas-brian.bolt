// Tailwind config: Joshua Brain custom design system
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jb: {
          bg: '#0c0c0e',
          card: '#131316',
          'card-hover': '#1a1a1f',
          accent: '#b8f94a',
          'accent-dim': '#8bc234',
          text: '#f2f2f3',
          'text-secondary': '#8a8a8e',
          'text-muted': '#55555a',
          border: '#1e1e23',
          'border-light': '#2a2a30',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#22c55e',
          ig: '#E1306C',
          tt: '#00f2ea',
          yt: '#FF0000',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
