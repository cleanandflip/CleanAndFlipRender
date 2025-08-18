# Universal Environment System Scripts

Add these scripts to package.json when possible:

```json
{
  "scripts": {
    "env:doctor": "tsx scripts/universal-env-doctor.ts",
    "env:check": "tsx scripts/universal-env-checker.ts",
    "start:dev": "APP_ENV=development node dist/index.js",
    "start:prod": "APP_ENV=production NODE_ENV=production node dist/index.js",
    "prestart": "npm run env:check && npm run env:doctor"
  }
}
```

## Manual Commands

```bash
# Run environment doctor
tsx scripts/universal-env-doctor.ts

# Run environment checker
tsx scripts/universal-env-checker.ts

# Start with specific environment
APP_ENV=development tsx server/index.ts
APP_ENV=production NODE_ENV=production tsx server/index.ts
```