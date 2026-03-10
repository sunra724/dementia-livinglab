import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        phase: {
          p1: '#6366f1',
          p2: '#3b82f6',
          p3: '#f59e0b',
          p4: '#10b981',
          p5: '#ef4444',
          p6: '#8b5cf6',
        },
        role: {
          activist: '#0ea5e9',
          institution: '#f97316',
          subject: '#a855f7',
        },
      },
    },
  },
  plugins: [],
}
export default config