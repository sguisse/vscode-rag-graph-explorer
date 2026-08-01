import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 5173,
    host: '127.0.0.1',
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    origin: 'http://127.0.0.1:5173',
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})
