#!/bin/bash
echo "Pushing schema to production database..."
echo "n" | drizzle-kit push --config=drizzle.config.prod.ts