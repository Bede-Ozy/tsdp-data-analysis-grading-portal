/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0054A6',        // NECA brand, main buttons, headers
          'primary-dark': '#003E7E',
          'primary-light': '#EBF3FC',
          secondary: '#F58220',      // ShamzBridge brand, accents, highlights
          'secondary-dark': '#D96E14',
          'secondary-light': '#FEF3E9',
          neutral: '#333333',        // Text, borders
          'neutral-muted': '#666666',
          'neutral-border': '#E0E0E0',
          bg: '#F5F5F5',             // Page backgrounds
          error: '#DC2626',          // Error messages
          success: '#003366',        // Success messages
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
