/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{tsx,mdx}', './components/**/*.{tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#4B4C8D',   // Future Dusk
        accent:  '#FF3B30',   // Red-Cup
        cta:     '#FFD84D',   // Button-Gelb
        lightbg: '#F7F7FA',   // neutrale Flächen
      },
    },
  },
  plugins: [],
}
