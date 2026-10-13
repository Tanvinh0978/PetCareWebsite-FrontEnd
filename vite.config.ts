import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api -> backend .NET (profile "https" trong launchSettings.json).
// Dùng proxy để tránh lỗi CORS và lỗi chứng chỉ dev tự ký.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    host: "localhost",
    port: 5286,
    strictPort: true,
    proxy: {
      "/api": { target: process.env.VITE_BACKEND_URL || "https://localhost:7287", changeOrigin: true, secure: false },
    },
  },
});
