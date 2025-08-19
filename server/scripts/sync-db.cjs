#!/usr/bin/env node
/* server/scripts/sync-db.cjs */
const assert = (c, m) => { if (!c) { console.error("❌ " + m); process.exit(1); } };

const apiKey     = process.env.NEON_API_KEY;
const projectId  = process.env.NEON_PROJECT_ID;
const prodBranch = process.env.PROD_BRANCH_ID;   // e.g. br-small-sky-adbcvz66
const devBranch  = process.env.DEV_BRANCH_ID;    // e.g. br-floral-glade-adajixy5
const prodEp     = process.env.PROD_ENDPOINT_ID; // e.g. ep-long-butterfly-...
const devEp      = process.env.DEV_ENDPOINT_ID;  // e.g. ep-crimson-scene-...
const apiBase    = process.env.NEON_API_BASE || "https://console.neon.tech/api/v2";

assert(apiKey, "NEON_API_KEY required");
assert(projectId, "NEON_PROJECT_ID required");
assert(prodBranch && devBranch, "Set PROD_BRANCH_ID and DEV_BRANCH_ID");
assert(prodEp && devEp, "Set PROD_ENDPOINT_ID and DEV_ENDPOINT_ID");

const dir = (process.argv.find(a=>a.startsWith("--from="))||"").split("=")[1] || "dev";
const to  = dir === "dev" ? "prod" : "dev";

const srcBranch = dir === "dev" ? devBranch : prodBranch;
const dstEndpoint = to === "prod" ? prodEp : devEp;

const fetchJSON = (url, init) =>
  fetch(url, init).then(async r => [r.ok, await r.json().catch(()=> ({}))]);

(async () => {
  // 1) Snapshot source
  const snapName = `sync-${dir}-to-${to}-${new Date().toISOString().replace(/[:.]/g,"-")}`;
  const [okSnap, snap] = await fetchJSON(
    `${apiBase}/projects/${projectId}/branches/${srcBranch}/snapshot`,
    { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: snapName }) }
  );
  if (!okSnap) { console.error("❌ Snapshot failed", snap); process.exit(1); }
  const snapshotId = snap?.snapshot?.id || snap?.data?.id;
  if (!snapshotId) { console.error("❌ Could not read snapshot id", snap); process.exit(1); }
  console.log(`📸 Snapshot ${snapshotId} created from ${srcBranch}`);

  // 2) Restore snapshot to a new branch
  const newBranchName = `synced-${dir}-to-${to}-${Date.now()}`;
  const [okRestore, restored] = await fetchJSON(
    `${apiBase}/projects/${projectId}/snapshots/${snapshotId}/restore`,
    { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ branch: { name: newBranchName } }) }
  );
  if (!okRestore) { console.error("❌ Restore failed", restored); process.exit(1); }
  const newBranchId = restored?.branch?.id || restored?.data?.branch?.id;
  console.log(`🌱 Restored to new branch ${newBranchId}`);

  // 3) Point target endpoint at the new branch
  const [okPatch, patched] = await fetchJSON(
    `${apiBase}/projects/${projectId}/endpoints/${dstEndpoint}`,
    { method: "PATCH", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ branch_id: newBranchId }) }
  );
  if (!okPatch) { console.error("❌ Endpoint patch failed", patched); process.exit(1); }

  console.log(`✅ Sync complete: ${dir.toUpperCase()} → ${to.toUpperCase()} | endpoint ${dstEndpoint} → ${newBranchId}`);
})();