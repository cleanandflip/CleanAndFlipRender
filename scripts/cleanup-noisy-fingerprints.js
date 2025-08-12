#!/usr/bin/env node
/**
 * Cleanup script to mark known noisy fingerprints as ignored
 * Run once to clean up existing noise in the observability system
 */

const FINGERPRINTS_TO_IGNORE = [
  "fp_1274482563", "fp_1531404053", "fp_1668786221", "fp_2129695444",
  "fp_1138877586", "fp_878558479", "fp_1756213730", "fp_378134670", 
  "fp_2106796842" // beacon.js
];

async function cleanup() {
  console.log(`🧹 Starting cleanup of ${FINGERPRINTS_TO_IGNORE.length} noisy fingerprints...`);
  
  for (const fp of FINGERPRINTS_TO_IGNORE) {
    try {
      const response = await fetch(`http://localhost:5000/api/observability/issues/${fp}/ignore`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log(`✅ Ignored fingerprint: ${fp}`);
      } else {
        console.log(`⚠️  Fingerprint not found: ${fp} (may not exist yet)`);
      }
    } catch (error) {
      console.log(`❌ Failed to ignore ${fp}:`, error.message);
    }
  }
  
  console.log('🎯 Cleanup completed! Observability feed should now show higher signal-to-noise ratio.');
}

cleanup();
