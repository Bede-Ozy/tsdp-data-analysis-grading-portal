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
          // ShamzBridge Orange Ecosystem (Primary Brand Owner)
          primary: '#F58220',
          'primary-dark': '#D96E14',
          'primary-light': '#FFF7ED',
          'primary-hover': '#EA580C',
          orange: '#F58220',
          'orange-glow': '#FF7A00',
          'orange-dark': '#C2410C',
          'orange-light': '#FFEDD5',

          // Institutional Partner Accents (NECA & ITF)
          secondary: '#0054A6',
          'secondary-dark': '#003E7E',
          'secondary-light': '#EBF3FC',
          
          // Neutrals & Surfaces
          neutral: '#1E293B',
          'neutral-dark': '#0F172A',
          'neutral-muted': '#64748B',
          'neutral-border': '#E2E8F0',
          bg: '#FAFAF8',
          surface: '#FFFFFF',
          
          // Status
          error: '#DC2626',
          success: '#059669',
          warning: '#D97706',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'orange-xs': '0 1px 3px 0 rgba(245, 130, 32, 0.2)',
        'orange-glow': '0 4px 20px -2px rgba(245, 130, 32, 0.25)',
        'orange-lg': '0 10px 25px -3px rgba(245, 130, 32, 0.3)',
        'card-hover': '0 12px 28px -5px rgba(245, 130, 32, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-up': 'scaleUp 0.25s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
