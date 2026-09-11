/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--page-bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--line)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        yellow: 'var(--yellow)',
        green: 'var(--green)',
        red: 'var(--red)',
        violet: 'var(--violet)',
      },
      fontFamily: {
        display: ['var(--font-oswald)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
