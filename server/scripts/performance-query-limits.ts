#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { Logger } from '../utils/logger';

// Add query limits to improve performance
function addQueryLimits(filePath: string): void {
  try {
    Logger.info(`Adding query limits to ${filePath}...`);
    
    let content = readFileSync(filePath, 'utf-8');
    
    // Add limits to user-facing queries but keep admin queries unlimited
    // Target patterns that don't already have limits
    const patterns = [
      // Products endpoint - add limit for general browsing
      {
        pattern: /\.select\(\)\s*\.from\(products\)\s*(?!.*limit|.*first|.*LIMIT)(?=.*res\.json)/g,
        replacement: '.select().from(products).limit(100)'
      },
      // Search queries - add reasonable limit
      {
        pattern: /\.select\(\)\s*\.from\(products\)\s*\.where\([^)]+\)(?!.*limit|.*first|.*LIMIT)(?=.*search)/g,
        replacement: '.select().from(products).where($1).limit(50)'
      }
    ];

    let hasChanges = false;
    
    for (const { pattern, replacement } of patterns) {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      if (content !== originalContent) {
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      writeFileSync(filePath, content, 'utf-8');
      Logger.info(`✓ Added performance limits to ${filePath}`);
    } else {
      Logger.info(`- No performance improvements needed in ${filePath}`);
    }
  } catch (error) {
    Logger.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  Logger.info('🚀 Adding performance query limits...\n');
  
  // Add limits to key routes
  addQueryLimits('server/routes.ts');
  
  Logger.info('\n✅ Performance improvements completed!');
}

main().catch(console.error);