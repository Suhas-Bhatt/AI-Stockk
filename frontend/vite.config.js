/**
 * ⚡ VITE CONFIGURATION
 * Vite is the modern build tool that makes development super fast.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 🔌 PLUGINS
  // 1. @vitejs/plugin-react: Enables React support (JSX, Fast Refresh)
  plugins: [
    react()
  ],
  
  // 🌐 SERVER CONFIG
  // You can customize the port or host here if needed.
  server: {
    port: 5178, // We've pinned this to 5178 for consistency
  }
})
