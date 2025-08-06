#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Files that need Logger import and console.log replacement
const targetFiles = [
  'server/scripts/check-schema-issues.ts',
  'server/scripts/normalize-emails.ts', 
  'server/services/password-reset.service.ts',
  'server/utils/startup-banner.ts',
  'server/utils/safe-query.ts',
  'server/db.ts',
  'server/auth.ts',
  'server/routes.ts',
  'server/config/redis.ts'
];

function addLoggerImport(content: string, filePath: string): string {
  // Skip if Logger import already exists
  if (content.includes('import { Logger }') || content.includes('from \'../utils/logger\'')) {
    return content;
  }

  // Determine correct relative path to logger
  const depth = filePath.split('/').length - 2; // Subtract 1 for 'server' and 1 for filename
  const relativePath = '../'.repeat(depth) + 'utils/logger';

  // Find the best place to insert import
  const lines = content.split('\n');
  let insertIndex = 0;

  // Look for last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') && lines[i].includes('from')) {
      insertIndex = i + 1;
    }
  }

  // Insert Logger import
  lines.splice(insertIndex, 0, `import { Logger } from '${relativePath}';`);
  
  return lines.join('\n');
}

function replaceConsoleLogs(content: string): string {
  return content
    .replace(/console\.log\(/g, 'Logger.info(')
    .replace(/console\.error\(/g, 'Logger.error(')
    .replace(/console\.warn\(/g, 'Logger.warn(')
    .replace(/console\.debug\(/g, 'Logger.debug(')
    .replace(/console\.info\(/g, 'Logger.info(');
}

async function fixFile(filePath: string): Promise<void> {
  try {
    Logger.info(`Fixing ${filePath}...`);
    
    const content = readFileSync(filePath, 'utf-8');
    
    // Add Logger import
    let updatedContent = addLoggerImport(content, filePath);
    
    // Replace console.log calls
    updatedContent = replaceConsoleLogs(updatedContent);
    
    // Write back if changes were made
    if (updatedContent !== content) {
      writeFileSync(filePath, updatedContent, 'utf-8');
      Logger.info(`✓ Fixed ${filePath}`);
    } else {
      Logger.info(`- No changes needed in ${filePath}`);
    }
  } catch (error) {
    Logger.error(`Error fixing ${filePath}:`, error);
  }
}

async function main() {
  Logger.info('🔧 Systematically fixing all console.log usage...\n');
  
  for (const file of targetFiles) {
    await fixFile(file);
  }
  
  Logger.info('\n✅ All console.log fixes completed!');
}

main().catch(console.error);