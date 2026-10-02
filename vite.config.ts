import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api -> backend .NET (profile "https" trong launchSettings.json).
// Dùng proxy để tránh lỗi CORS và lỗi chứng chỉ dev tự ký.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://localhost:7287', changeOrigin: true, secure: false },
    },
  },
});
