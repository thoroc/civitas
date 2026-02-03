import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  daisyui: {
    themes: [
      {
        civitas: {
          primary: '#1F3A60',
          'primary-content': '#FFFFFF',
          secondary: '#D4A72C',
          'secondary-content': '#1F1600',
          accent: '#0E8FC6',
          'accent-content': '#F0F9FF',
          neutral: '#374151',
          'neutral-content': '#F9FAFB',
          'base-100': '#F5F7FA',
          'base-200': '#E5E9EF',
          'base-300': '#CFD5DD',
          info: '#0EA5E9',
          success: '#15803D',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
      {
        'civitas-dark': {
          primary: '#93C5FD',
          'primary-content': '#0F172A',
          secondary: '#F2C661',
          'secondary-content': '#1F1300',
          accent: '#38BDF8',
          'accent-content': '#082F49',
            neutral: '#94A3B8',
          'neutral-content': '#0F172A',
          'base-100': '#0F172A',
          'base-200': '#1E293B',
          'base-300': '#334155',
          info: '#38BDF8',
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#F87171',
        },
      },
      'light',
      'dark'
    ],
  },
  plugins: [require('daisyui')],
};
export default config;
