#!/usr/bin/env bash
set -euo pipefail

echo "🔍 LEGACY REFERENCE CHECKER - Enforcing SSOT Address System"
echo "============================================================"

# Banned tokens (old columns, endpoints, filenames, props)
PATTERNS=(
  # Legacy user columns that were dropped
  "users\.street\b"
  "users\.city\b" 
  "users\.state\b"
  "users\.zip_code\b"
  "users\.latitude\b"
  "users\.longitude\b"
  # Legacy object properties in JS/TS
  "\bstreet\s*:"
  "\bzipCode\s*:"
  "\bfullAddress\s*:"
  # Legacy imports/components
  "Address.*Legacy"
  "Onboarding.*Legacy"
  "checkout_broken"
)

# Allow list where these words are legitimate (SSOT system)
ALLOW='addresses\.ts|AddressForm|StepAddress|server/routes/addresses|client/src/api/addresses|shared/schema\.ts.*addresses|server/lib/addressCanonicalizer'

FAIL=0
for p in "${PATTERNS[@]}"; do
  if rg -n --hidden -S -g '!docs/**' -g '!attached_assets/**' -g '!node_modules/**' -e "$p" . \
      | grep -v -E "$ALLOW" \
      | grep -v '\.sql$' > /tmp/legacy_hits.txt 2>/dev/null; then
    if [[ -s /tmp/legacy_hits.txt ]]; then
      echo "❌ Legacy pattern detected: $p"
      cat /tmp/legacy_hits.txt
      FAIL=1
    fi
  fi
done

if [[ $FAIL -eq 1 ]]; then
  echo ""
  echo "🔴 LEGACY REFERENCES DETECTED - BUILD BLOCKED"
  echo "============================================="
  echo "The codebase contains references to the old address system."
  echo "All address data must use the SSOT addresses table."
  echo ""
  echo "Fix these references or move files to docs/_graveyard/ if archival."
  exit 1
fi

echo "🟢 NO LEGACY REFERENCES DETECTED"
echo "================================"
echo "SSOT address system integrity confirmed ✅"