import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    minify: "terser",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["wouter"],
          "vendor-query": ["@tanstack/react-query"],

          // UI library chunks
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],

          // Form handling
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],

          // Utilities
          "vendor-utils": ["clsx", "tailwind-merge", "date-fns", "lodash-es"],

          // Icons
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "wouter"],
    exclude: ["@stripe/stripe-js"],
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    port: 5173,
    strictPort: true,
    proxy: {
      '/api':    { target: process.env.VITE_API_URL || 'http://localhost:4000', changeOrigin: true },
      '/healthz':{ target: process.env.VITE_API_URL || 'http://localhost:4000', changeOrigin: true },
    }
  },
});
