#!/bin/bash
set -e

echo "🔍 LEGACY REFERENCE CHECKER - Enforcing SSOT Address System"
echo "============================================================"

# Check for legacy address patterns
LEGACY_PATTERNS=(
  "addressesOld"
  "LegacyAddress"
  "ProfileAddress.*old"
  "users\.street\b"
  "users\.city\b"
  "users\.state\b"
  "users\.zipCode\b"
  "users\.address\b"
  "No saved addresses"
  "AddressesSection"
  "AddressCard"
  "AddressItem"
  "ProfileAddresses"
)

FOUND_LEGACY=false

for pattern in "${LEGACY_PATTERNS[@]}"; do
  if rg -q "$pattern" client/ server/ 2>/dev/null; then
    echo "❌ Legacy pattern detected: $pattern"
    rg -n "$pattern" client/ server/ 2>/dev/null || true
    FOUND_LEGACY=true
  fi
done

if [ "$FOUND_LEGACY" = true ]; then
  echo ""
  echo "❌ LEGACY REFERENCES DETECTED"
  echo "Please remove all legacy address references before proceeding."
  echo "Use only SSOT address system: /api/addresses, AddressForm, AddressList"
  exit 1
else
  echo "✅ No legacy address references detected"
  echo "✅ SSOT address system is properly enforced"
fi