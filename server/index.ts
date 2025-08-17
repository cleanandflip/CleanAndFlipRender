// server/index.ts
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env";
import { assertProdDB } from "./config/guards";
import { applyMigrations } from "./db/migrate";
import { ping } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

// 1) Boot logs that must appear once
console.log("[BOOT]", { env: env.APP_ENV, nodeEnv: env.NODE_ENV, build: env.APP_BUILD_ID });

// Use the appropriate database URL based on environment
import { getDatabaseConfig } from "./config/database";
const dbConfig = getDatabaseConfig();
console.log("[BOOT] DB:", new URL(dbConfig.url).host);

// 2) Prod DB guard + migrations before routes
assertProdDB();

await applyMigrations().catch((e) => {
  console.error("[MIGRATIONS] Failed:", e);
  process.exit(1); // fail fast; no crash loops from half-booted servers
});

// Optional DB reachability check
await ping().catch((e) => {
  console.error("[DB] Ping failed:", e);
  process.exit(1);
});

// 3) Express app
const app = express();
app.set("trust proxy", 1);

app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: ONE_MONTH,
  },
}));

app.use(express.json());

// Register API routes - they handle server startup internally  
await registerRoutes(app);