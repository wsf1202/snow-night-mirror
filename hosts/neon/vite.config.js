import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command }) => ({
  base: '/',
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

/* solo-host publish refresh */
