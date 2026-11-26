import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = dirname(fileURLToPath(import.meta.url))

// Cursor publish-app serves at apex `/`. GitHub Pages needs a subpath — set
// VITE_BASE=/snow-night-mirror/ in .github/workflows/deploy.yml.
export default defineConfig(() => ({
  base: process.env.VITE_BASE || '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        customize: resolve(root, 'customize.html'),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow Cloudflare / localtunnel preview hosts
    allowedHosts: true,
  },
}))
