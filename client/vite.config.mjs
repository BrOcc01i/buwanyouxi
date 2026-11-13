import { defineConfig } from 'vite';

// Vite 配置：root 指向 src，构建产物输出到项目根 dist
export default defineConfig({
  root: 'src',
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
