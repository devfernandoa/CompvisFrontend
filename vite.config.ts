import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // any request to /api_placa will go to your FastAPI
      '/api_placa': {
        target: 'http://ec2-13-218-71-196.compute-1.amazonaws.com:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_placa/, ''),
      },
    },
  },
})

