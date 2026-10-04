/** @type {import('tailwindcss').Config} */
export default {
  // Компоненты используют Tailwind-классы: приложение-потребитель должно
  // добавить путь к пакету в свой `content`, например
  // './node_modules/@yellowweb/ui/**/*.{ts,tsx}'.
  content: ['./packages/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
