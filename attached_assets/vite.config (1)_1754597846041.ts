import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
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
  },
});
