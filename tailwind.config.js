// All palette values come from css/main.css, including translucent utilities.
const token = name => `var(--${name})`;

module.exports = {
  content: ['./index.html', './js/**/*.js', './posts/**/*.md', './about.md'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: token('bg-page'), surface: token('bg-surface'), codebg: token('bg-code'),
        primary: token('text-primary'), secondary: token('text-secondary'), muted: token('text-muted'),
        accent: token('accent-primary'), cyanAccent: token('accent-secondary'),
        subtle: 'var(--border-subtle)', hover: 'var(--border-hover)', divider: 'var(--divider)'
      },
      fontFamily: { sans: ['var(--font-sans)'], mono: ['var(--font-mono)'] },
      transitionDuration: { DEFAULT: '180ms' },
      transitionTimingFunction: { DEFAULT: 'ease-out' }
    }
  },
  plugins: []
};
