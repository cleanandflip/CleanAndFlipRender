#!/usr/bin/env node
/* server/scripts/neon-checkpoint.cjs */
const assert = (c, m) => { if (!c) { console.error("❌ " + m); process.exit(1); } };

const apiKey     = process.env.NEON_API_KEY;
const projectId  = process.env.NEON_PROJECT_ID;
const branchId   = process.env.NEON_BRANCH_ID || process.env.PROD_BRANCH_ID || process.env.DEV_BRANCH_ID;
const apiBase    = process.env.NEON_API_BASE || "https://console.neon.tech/api/v2"; // v2 REST

assert(apiKey, "NEON_API_KEY is required");
assert(projectId, "NEON_PROJECT_ID is required");
assert(branchId, "NEON_BRANCH_ID (or PROD/DEV) is required");

const nameArg = (process.argv.find(a => a.startsWith("--name=")) || "").split("=")[1];
const name = nameArg || `cp-${new Date().toISOString().replace(/[:.]/g,"-")}`;

(async () => {
  const res = await fetch(
    `${apiBase}/projects/${projectId}/branches/${branchId}/snapshot`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("❌ Snapshot failed:", body);
    process.exit(1);
  }
  console.log("✅ Snapshot created", body);
  // body.data?.id is typically the snapshot ID you'll use to restore.
})();