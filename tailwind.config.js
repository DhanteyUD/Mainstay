/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0b0f',
          surface: '#10121a',
          card: '#141720',
          border: '#1e2235',
          accent: '#00e5ff',
          accentDim: '#00b4cc',
          green: '#00ff94',
          red: '#ff4757',
          yellow: '#ffd700',
          muted: '#4a5568',
          text: '#e2e8f0',
          dim: '#8892a4',
          bright: '#f8f9fa',
        },
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'Courier New', 'monospace'],
        'dm-mono': ['DM Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
