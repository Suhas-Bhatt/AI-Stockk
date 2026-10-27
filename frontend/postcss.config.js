/**
 * 🛠️ POSTCSS CONFIGURATION
 * PostCSS is the "translator" that takes your modern Tailwind code
 * and converts it into standard CSS that every browser understands.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export default {
    plugins: {
      // 1️⃣ The Tailwind Pre-processor (Specific v4 version)
      '@tailwindcss/postcss': {},

      // 2️⃣ Autoprefixer: Adds tags like '-webkit-' so things look the same on Safari/Chrome/Firefox.
      autoprefixer: {},
    },
};
