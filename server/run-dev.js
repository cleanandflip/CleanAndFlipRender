#!/usr/bin/env node

// Alternative dev runner for when tsx is not available
import { spawn } from 'child_process';
import { watch } from 'fs';
import { resolve } from 'path';

let serverProcess = null;

function startServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
  
  console.log('Starting server...');
  
  // Try different TypeScript runners in order of preference
  const runners = [
    'npx tsx server/index.ts',
    'npx ts-node server/index.ts',
    'node --loader ts-node/esm server/index.ts'
  ];
  
  for (const runner of runners) {
    try {
      const [cmd, ...args] = runner.split(' ');
      serverProcess = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true
      });
      
      serverProcess.on('error', (err) => {
        console.error(`Failed to start with ${runner}:`, err.message);
      });
      
      break;
    } catch (err) {
      console.log(`${runner} not available, trying next...`);
      continue;
    }
  }
}

// Watch for changes
const watchPaths = ['server', 'shared'];
watchPaths.forEach(path => {
  watch(resolve(path), { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`File changed: ${filename}`);
      startServer();
    }
  });
});

startServer();

process.on('SIGINT', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit();
});