import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light theme: white / blue / red
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        accent: {
          50: '#fef2f2',
          500: '#dc2626',
          600: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
};

export default config;
