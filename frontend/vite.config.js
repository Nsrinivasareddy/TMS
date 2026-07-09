import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api' తో మొదలయ్యే అన్ని రిక్వెస్ట్‌లు 5000 పోర్ట్‌కి వెళ్తాయి
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})