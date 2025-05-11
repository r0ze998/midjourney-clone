/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], // ← 必ずこの行を含める
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7d3cf8',
          dark: '#130d25',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        matrixScroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
      },
      animation: {
        'matrix-scroll': 'matrixScroll 40s linear infinite',
      },
    },
  },
  plugins: [], // プラグインはまだ追加しない
};
