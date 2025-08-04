import { build } from 'esbuild'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  format: 'esm',
  packages: 'external',
  external: [
    // Exclude scripts directory from build since it's dev-only
    './scripts/*',
    './server/scripts/*'
  ],
  // Handle TypeScript module resolution correctly
  resolveExtensions: ['.ts', '.js'],
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
}).catch(() => process.exit(1))