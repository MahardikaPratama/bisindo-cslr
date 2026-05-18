/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-blue':        '#2563EB',
        'brand-blue-light':  '#3B82F6',
        'brand-blue-dark':   '#1D4ED8',
        'surface-bg':        'var(--color-surface-bg)',
        'surface-panel':     'var(--color-surface-panel)',
        'surface-panel-2':   'var(--color-surface-panel-2)',
        'surface-border':    'var(--color-surface-border)',
        'surface-hover':     'var(--color-surface-hover)',
        'text-primary':      'var(--color-text-primary)',
        'text-secondary':    'var(--color-text-secondary)',
        'text-muted':        'var(--color-text-muted)',
        'success-green':     '#22C55E',
        'success-bg':        'var(--color-success-bg)',
        'console-info':      '#4ADE80',
        'console-process':   '#60A5FA',
        'console-error':     '#F87171',
        'gloss-active':      '#2563EB',
        'gloss-pending':     'var(--color-gloss-pending)',
        'gpu-bar':           '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out',
        'slide-up':    'slideUp 0.5s ease-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink':       'blink 1.2s step-end infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 8px rgba(37, 99, 235, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.6)' },
        },
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'hero-grid':        'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
      boxShadow: {
        'panel':     '0 0 0 1px var(--color-surface-border), 0 4px 24px rgba(0,0,0,0.1)',
        'panel-glow':'0 0 0 1px rgba(37,99,235,0.3), 0 4px 32px rgba(37,99,235,0.1)',
        'btn-primary':'0 4px 16px rgba(37,99,235,0.4)',
      },
    },
  },
  plugins: [],
}
