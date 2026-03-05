import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    proxy: {
      // Everything under /chat will be forwarded to the Cycls dev server
      "/chat": {
        target: "http://127.0.0.1:8080", // <-- use the host/port your agent prints
        changeOrigin: true,
      },
      "/config": {
        target: "http://127.0.0.1:8080", // <-- use the host/port your agent prints
        changeOrigin: true,
      },
      "/attachments": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/sessions": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/files": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
