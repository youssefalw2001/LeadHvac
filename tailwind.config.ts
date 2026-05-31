import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#08112f',
        muted: '#5e6b86',
        brand: '#0b5cff',
        brandDark: '#003ecb',
        emerald: '#17b26a',
        warning: '#ff8a00'
      },
      boxShadow: {
        soft: '0 24px 80px rgba(8, 17, 47, 0.12)',
        card: '0 14px 50px rgba(8, 17, 47, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
