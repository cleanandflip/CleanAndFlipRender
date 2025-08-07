import { build } from 'esbuild'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔨 Building server for production...')

const buildStart = Date.now()

await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  target: 'node18', // Ensure compatibility with Cloud Run
  format: 'esm',
  packages: 'external',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  external: [
    // Exclude scripts directory from build since it's dev-only
    './scripts/*',
    './server/scripts/*'
  ],
  // Handle TypeScript module resolution correctly
  resolveExtensions: ['.ts', '.js'],
  define: {
    // Ensure process.env.NODE_ENV is properly set at build time
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  plugins: [{
    name: 'resolve-ts-imports',
    setup(build) {
      // Resolve .js imports to .ts files during build
      build.onResolve({ filter: /\.js$/ }, async (args) => {
        if (args.path.endsWith('.js') && !args.path.includes('node_modules')) {
          const tsPath = args.path.replace(/\.js$/, '.ts')
          const resolvedPath = resolve(args.resolveDir, tsPath)
          return { path: resolvedPath }
        }
      })
    }
  }]
}).then(() => {
  const buildTime = Date.now() - buildStart
  console.log(`✅ Server build completed in ${buildTime}ms`)
  console.log('📦 Output: dist/index.js')
  console.log('🚀 Ready for production deployment')
}).catch((error) => {
  console.error('❌ Build failed:', error)
  process.exit(1)
})