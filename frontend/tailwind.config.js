/**
 * 🎨 TAILWIND CONFIGURATION
 * This file tells Tailwind CSS which files to scan for utility classes.
 */

export default {
    /**
     * 🔍 CONTENT SCANNING
     * We tell Tailwind to look at every .js, .jsx, and .html file inside /src.
     * This ensures only the CSS you actually USE gets included in the final build.
     */
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    
    /**
     * 🧩 THEME EXTENSIONS
     * Here you can add custom colors, fonts, or breakpoints.
     */
    theme: {
      extend: {},
    },
    
    plugins: [],
};