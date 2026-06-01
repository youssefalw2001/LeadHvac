import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        jobleak: {
          ink: '#08111f',
          panel: '#0d1728',
          blue: '#2f6df6',
          orange: '#ff7a1a',
          paper: '#fbfcfe',
          muted: '#526074',
          border: '#dfe6f0'
        }
      },
      boxShadow: {
        premium: '0 18px 42px rgba(8,17,31,0.07)',
        executive: '0 44px 120px rgba(8,17,31,0.22)'
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem'
      }
    }
  },
  plugins: []
};

export default config;
