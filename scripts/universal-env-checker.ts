/* eslint-disable no-console */
import { readdirSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import "dotenv/config";
// Import relative to current working directory
import { APP_ENV, DB_HOST, DEV_DB_HOST, PROD_DB_HOST, WEBHOOK_PREFIX } from "../server/config/universal-env.js";

type Issue = { file: string; line: number; msg: string; };

const ROOT = process.cwd();
const SRC_DIRS = ["server", "client"].map(d => join(ROOT, d));
const ALLOW_ENV_DIRECT = new Set<string>([
  // allowlist any files that are permitted to read process.env directly
  "server/config/universal-env.ts",
  "server/config/env.ts", // existing env config
  "server/config/environment.ts", // existing env config
]);

const issues: Issue[] = [];

function scanFile(file: string) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((ln, i) => {
    const line = i + 1;

    // 1) raw process.env usage (must import from config/universal-env.ts)
    if (/process\.env\./.test(ln) && !ALLOW_ENV_DIRECT.has(rel(file))) {
      issues.push({ file, line, msg: "Use server/config/universal-env.ts; do not read process.env directly." });
    }

    // 2) hardcoded http(s):// URLs in client code (prefer relative)
    if (/\bhttps?:\/\/[a-z0-9\.\-]/i.test(ln) && file.includes("client")) {
      issues.push({ file, line, msg: "Hardcoded absolute URL in client; prefer relative or VITE_API_BASE_URL." });
    }

    // 3) webhook routes must use WEBHOOK_PREFIX
    if (/app\.post\(\s*["'`]\/webhooks?\//.test(ln)) {
      issues.push({ file, line, msg: `Webhook route found without ${WEBHOOK_PREFIX}. Use mountUniversalWebhooks() from server/webhooks/universal-router.ts.` });
    }

    // 4) session cookie flags must be env-aware (very rough guard)
    if (/sameSite\s*:\s*['"]none['"]/.test(ln) && !/APP_ENV/.test(text)) {
      issues.push({ file, line, msg: "Cookie sameSite='none' must be conditional on production (see server/middleware/universal-session.ts)." });
    }

    // 5) fetch without credentials (client)
    if (file.includes("client") && /\bfetch\(/.test(ln) && !/credentials\s*:\s*['"]include['"]/.test(ln)) {
      issues.push({ file, line, msg: "fetch without credentials. Add { credentials: 'include' } for session APIs." });
    }
  });
}

function rel(p: string) { 
  return p.replace(`${ROOT}/`, ""); 
}

function walk(dir: string) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(p))) {
        scanFile(p);
      }
    }
  } catch (error) {
    // Directory might not exist, skip silently
  }
}

console.log(`[UNIVERSAL-ENV-CHECK] app=${APP_ENV} dbHost=${DB_HOST} (dev=${DEV_DB_HOST} prod=${PROD_DB_HOST})`);
SRC_DIRS.forEach(d => walk(d));

if (issues.length) {
  console.error("\n❌ Universal Environment checker found issues:");
  for (const it of issues) {
    console.error(` - ${rel(it.file)}:${it.line}  ${it.msg}`);
  }
  process.exit(1);
}
console.log("✅ Universal Environment checker passed");