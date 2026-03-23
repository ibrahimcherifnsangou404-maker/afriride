import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Warn only on chunks > 1 MB (avoids noisy warnings on large pages like MessagesPage)
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime → tiny "vendor" chunk cached long-term
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Icon library (can be heavy)
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Socket.io client
          if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
            return 'vendor-socket';
          }
          // Admin pages (rarely visited, split for smaller public bundle)
          if (id.includes('/pages/admin/')) {
            return 'chunk-admin';
          }
          // Manager pages
          if (id.includes('/pages/manager/')) {
            return 'chunk-manager';
          }
        },
      },
    },
  },
})
