import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      // local dev: `node scripts/dev-api.mjs` serves the same functions Vercel runs
      '/api': 'http://localhost:3011',
    },
  },
})
