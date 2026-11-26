import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.TALKREADY_BACKEND_URL || 'http://127.0.0.1:3737',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (_error, _request, response) => {
            if (!response || response.headersSent) {
              return;
            }
            response.writeHead(503, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
              error: {
                code: 'BACKEND_UNREACHABLE',
                message: "Can't reach the TalkReady server",
              },
            }));
          });
        },
      },
    },
  },
});
