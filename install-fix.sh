#!/bin/bash

echo "🔧 Fixing NPM installation for Replit..."

# Clear everything
echo "Clearing old modules..."
rm -rf node_modules package-lock.json .npm .cache

# Create necessary directories
mkdir -p .npm-cache .npm-prefix

# Install in chunks to prevent timeout
echo "Installing core dependencies..."
npm install express drizzle-orm @neondatabase/serverless

echo "Installing React dependencies..."
npm install react react-dom @vitejs/plugin-react vite

echo "Installing build tools..."
npm install -D typescript tsx esbuild

echo "Installing UI dependencies..."
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu lucide-react

echo "Installing remaining dependencies..."
npm install

echo "✅ Installation complete!"
ls -la node_modules/@vitejs/