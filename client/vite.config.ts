import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const enableSsl = process.env.VITE_SSL === 'true';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(enableSsl ? [basicSsl()] : [])],
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api/market/tnb': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/market\/tnb/, '/v8/finance/chart/5347.KL?interval=5m&range=1d'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    }
  },
})

