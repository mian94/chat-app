import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [react()],
  root: 'src', // 指定 src 目录为项目源码根目录
  build: {
    outDir: '../dist'
  }
})
