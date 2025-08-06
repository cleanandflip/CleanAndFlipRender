#!/bin/bash

# Script to update all hardcoded API URLs to use VITE_API_URL
echo "Updating API URLs for Vercel deployment..."

# Find and replace fetch('/api/ with fetch(\`\${import.meta.env.VITE_API_URL || ''}/api/
find client/src -name "*.tsx" -o -name "*.ts" | while read -r file; do
  if grep -q "fetch('/api/" "$file"; then
    echo "Updating: $file"
    sed -i "s|fetch('/api/|fetch(\`\${import.meta.env.VITE_API_URL \|\| ''}/api/|g" "$file"
    sed -i "s|')|')\`|g" "$file"
  fi
done

echo "API URL update complete!"