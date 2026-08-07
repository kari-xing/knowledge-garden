import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 开发模式：将 /api 代理到本地 FastAPI 后端，避免跨域
      // 注意：若本机 8000 端口被其他进程占用，后端请用 8011（本项目默认）
      '/api': {
        target: 'http://localhost:8011',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ['d3'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
});
