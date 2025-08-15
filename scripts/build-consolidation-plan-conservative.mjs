import fs from "fs";
const allowBan = JSON.parse(fs.readFileSync("audit/ssot-allow-ban.json","utf8"));

const actions = { replaceImportsThenDelete: [], deleteSafe: [], reviewManual: [] };

// Only proceed with the explicit legacy banlist - these are known problematic files
allowBan.legacyBan.forEach(p => {
  // Check if file actually exists before marking for deletion
  try {
    fs.accessSync(p);
    actions.replaceImportsThenDelete.push({file:p, canonical:null, reason:"legacy-banned"});
  } catch (e) {
    console.log(`Skipping ${p} - does not exist`);
  }
});

// Only delete clearly safe files that are actually unused scripts/configs
const safeToDelete = [
  'scripts/cleanup-noisy-fingerprints.js',
  'scripts/codebase-doctor.cjs', 
  'scripts/codebase-doctor.ts',
  'scripts/denylist-check.js',
  'scripts/scan-locality-offenders.ts',
  'server/config/compression.d.ts',
  'server/data/errorStore.ts',
  'server/data/simpleErrorStore.ts',
  'server/lib/legacy-guard.ts',
  'server/lib/fingerprint.ts',
  'server/middleware/capture.ts',
  'server/middleware/performanceOptimization.ts',
  'server/middleware/rateLimiter.ts',
  'server/middleware/request-consolidator.ts',
  'server/observability/schema.ts',
  'server/routes/health-comprehensive.ts',
  'server/routes/health.ts',
  'server/routes/status.ts'
];

safeToDelete.forEach(f => {
  try {
    fs.accessSync(f);
    actions.deleteSafe.push({file:f, reason:"safe-cleanup"});
  } catch (e) {
    // File doesn't exist, skip
  }
});

fs.writeFileSync("audit/consolidation-plan-conservative.json", JSON.stringify(actions,null,2));
console.log(`Conservative plan -> audit/consolidation-plan-conservative.json`);
console.log(`Actions: ${actions.replaceImportsThenDelete.length} replace/delete, ${actions.deleteSafe.length} safe deletes`);