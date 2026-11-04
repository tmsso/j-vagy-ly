import type { Config } from 'tailwindcss'

// Colours point at the CSS variables in app/globals.css, which flip for dark mode.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        card: token('card'),
        subtle: token('subtle'),
        line: token('line'),
        ink: { DEFAULT: token('ink'), muted: token('ink-muted') },
        primary: { 50: token('primary-50'), 600: token('primary-600'), text: token('primary-text') },
        success: { 50: token('success-50'), 600: token('success-600'), 700: token('success-700') },
        error: { 50: token('error-50'), 600: token('error-600'), 700: token('error-700') },
        'on-feedback': token('on-feedback'),
        'switch-off': token('switch-off'),
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      fontFamily: {
        // next/font registers the fonts under generated names and exposes them
        // as these CSS variables (app/layout.tsx); naming 'Inter' directly would miss.
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['var(--font-literata)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
