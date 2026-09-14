import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Keep the framework in its own long-lived chunk so app edits don't
    // invalidate it for returning students.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'lucide-icons';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/v1': {
        target: 'https://xlerp.xlri.ac.in',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
