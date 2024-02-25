import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  daisyui: {
    themes: [
      'light',
      'dark',
      'cyberpunk',
      {
        imbc: {
          primary: '#a16207',
          secondary: '#ea580c',
          accent: '#eab308',
          neutral: '#e7e5e4',
          'base-100': '#1f2730',
          info: '#00b6df',
          success: '#4fc634',
          warning: '#fb7185',
          error: '#e879f9',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
};
export default config;
