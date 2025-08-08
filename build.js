#!/usr/bin/env node

import { spawn } from 'child_process'

// First build the frontend
console.log('Building frontend...')
const viteBuild = spawn('npx', ['vite', 'build'], { stdio: 'inherit' })

viteBuild.on('close', (code) => {
  if (code !== 0) {
    console.error('Frontend build failed')
    process.exit(1)
  }
  
  console.log('Building backend...')
  // Then build the backend using our custom config
  const esbuildProcess = spawn('node', ['esbuild.config.js'], { stdio: 'inherit' })
  
  esbuildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('Backend build failed')
      process.exit(1)
    }
    
    console.log('Build completed successfully!')
  })
})