import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const enableSsl = process.env.VITE_SSL === 'true';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(enableSsl ? [basicSsl()] : [])],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/market/tnb': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/market\/tnb/, '/v8/finance/chart/5347.KL?interval=5m&range=1d'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            const serverResponse = res as import('http').ServerResponse;
            if (serverResponse && !serverResponse.headersSent) {
              serverResponse.writeHead(502, { 'Content-Type': 'application/json' });
              serverResponse.end(JSON.stringify({ error: 'Market proxy unavailable' }));
            }
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
})

