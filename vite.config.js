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
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/config": {
        target: "http://127.0.0.1:8080",
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
      // Proxy POST requests to "/" to the backend (must be last since "/" matches everything)
      "/": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        bypass(req) {
          // Only proxy POST to exactly "/"; let everything else through to Vite
          if (req.method === "POST" && req.url === "/") return;
          return req.url;
        },
      },
    },
  },
});
