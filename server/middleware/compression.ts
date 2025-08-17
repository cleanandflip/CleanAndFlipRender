import compression from "compression";
import path from "path";
import express from "express";
import type { Application } from "express";
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupProductionOptimizations(app: Application) {
  if (process.env.NODE_ENV === "production") {
    // Enable compression for all routes
    app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        // Default filter: only compress if standard filter allows it
        return (compression as unknown as { filter: (req: any, res: any) => boolean }).filter?.(req, res) ?? true;
      },
      threshold: 0,
    }));
    
    // Serve built assets with long-term caching
    app.use(
      express.static(path.join(__dirname, "../../client-dist"), {
        etag: true,
        lastModified: true,
        maxAge: "365d", // 1 year for static assets
        setHeaders(res, filePath) {
          // HTML files should not be cached (for deployments)
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          }
          // JS/CSS assets get long cache with content hashing
          else if (filePath.match(/\.(js|css|woff2?|ttf|eot)$/)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
          // Images get moderate caching
          else if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
            res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
          }
        },
      })
    );
  }
}