# Style-locked publish hosts

One Cursor `publish-app` project per art style (never a combined chip site).

| Folder | Style lock | Suggested slug | Live URL |
|--------|------------|----------------|----------|
| `hosts/pixel` | pixel | `snow-night-mirror` (existing app is still published from repo root `.`) | https://snow-night-mirror.apps.grok.bot |
| `hosts/vintage` | vintage postcard | `snow-night-vintage` | https://snow-night-vintage.apps.grok.bot |
| `hosts/paper` | paper craft | `snow-night-paper` | https://snow-night-paper.apps.grok.bot |
| `hosts/neon` | neon | `snow-night-neon` | https://snow-night-neon.apps.grok.bot |

Each folder is a self-contained Vite app with `base: '/'` for Cursor hosting.

## Assets (`public/`)

`hosts/*/public/` is **gitignored**. Canonical art lives in repo-root `public/`. Before `vite` or `publish-app` on a host:

```bash
node scripts/sync-host-public.mjs          # all four
node scripts/sync-host-public.mjs vintage  # one style
```

## Pixel / `snow-night-mirror`

The live slug `snow-night-mirror` is bound to the **repo root** (`.`). Root publish packs `src/` + `public/` + host *source* (not host `public/`), which stays under the 50MB limit. `hosts/pixel` mirrors the other solo hosts for local/repro; do not invent a new pixel URL.
