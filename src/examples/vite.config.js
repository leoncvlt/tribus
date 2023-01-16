import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: "./assets/static",
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    brotliSize: 1024,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"] },
      },
    },
  },
});
