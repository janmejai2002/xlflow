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
        manualChunks: {
          react: ['react', 'react-dom'],
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
