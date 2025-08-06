#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Function to recursively find all TypeScript files
function findAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function fixConsoleLogsInFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check if file has console.log but not Logger import
    if (content.includes('console.') && !content.includes('import { Logger }')) {
      console.info(`Adding Logger import to ${filePath}`);
      
      // Determine relative path to logger
      const parts = filePath.split('/');
      const serverIndex = parts.findIndex(p => p === 'server');
      if (serverIndex === -1) return false;
      
      const depth = parts.length - serverIndex - 2; // -2 for 'server' and filename
      const relativePath = depth > 0 ? '../'.repeat(depth) + 'utils/logger' : './utils/logger';
      
      // Add import after existing imports
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') && lines[i].includes('from')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, `import { Logger } from '${relativePath}';`);
      
      // Replace console calls
      let updatedContent = lines.join('\n')
        .replace(/console\.log\(/g, 'console.info(')
        .replace(/console\.error\(/g, 'console.error(')
        .replace(/console\.warn\(/g, 'console.warn(')
        .replace(/console\.debug\(/g, 'console.debug(')
        .replace(/console\.info\(/g, 'console.info(');
      
      writeFileSync(filePath, updatedContent, 'utf-8');
      console.info(`✅ Fixed ${filePath}`);
      return true;
    }
    
    // Just replace console calls if Logger import exists
    if (content.includes('console.') && content.includes('import { Logger }')) {
      const updatedContent = content
        .replace(/console\.log\(/g, 'console.info(')
        .replace(/console\.error\(/g, 'console.error(')
        .replace(/console\.warn\(/g, 'console.warn(')
        .replace(/console\.debug\(/g, 'console.debug(')
        .replace(/console\.info\(/g, 'console.info(');
      
      if (updatedContent !== content) {
        writeFileSync(filePath, updatedContent, 'utf-8');
        console.info(`✅ Updated console calls in ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.info('🔧 Finding and fixing ALL remaining console.log instances...\n');
  
  const allTsFiles = findAllTsFiles('server');
  let fixedCount = 0;
  
  for (const file of allTsFiles) {
    if (fixConsoleLogsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.info(`\n✅ Fixed ${fixedCount} files with console.log issues!`);
  
  // Check remaining count
  const { execSync } = require('child_process');
  try {
    const remaining = execSync(`grep -r "console\\." server/ --include="*.ts" | grep -v "logger" | wc -l`, { encoding: 'utf-8' });
    console.info(`📊 Remaining console.log instances: ${remaining.trim()}`);
  } catch (error) {
    console.info('Could not count remaining instances');
  }
}

main().catch(console.error);