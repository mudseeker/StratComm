import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const serverPort = Number(process.env.SERVER_PORT ?? 3000);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true
      },
      '/ws': {
        target: `ws://localhost:${serverPort}`,
        ws: true,
        changeOrigin: true
      }
    }
  }
});
