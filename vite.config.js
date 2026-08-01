import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Lokalde `npm run dev` ile çalışırken /api istekleri buraya yönlenir.
      // Prod build'de nginx zaten aynı domain üzerinden /api'yi backend'e
      // yönlendirdiği için bu proxy sadece geliştirme ortamı içindir.
      "/api": {
        target: "https://teklifmeydani.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
