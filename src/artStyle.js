/**
 * Art style resolver — theme (Christmas) × art style (pixel | vintage | paper).
 * Default remains pixel so the kept build is unchanged.
 *
 * Solo demos: set VITE_SOLO_STYLE=paper (etc.) so bare `/` is that style only
 * and multi-style chips stay hidden. Separate host/URL per style.
 */

export const ART_STYLES = {
  pixel: {
    id: 'pixel',
    label: '像素雪夜',
    labelLatin: 'Pixel Snow Night',
    tag: 'PIXEL SNOW NIGHT',
    brand: '雪夜祝福',
    brandLatin: 'Snow Night Mirror',
    lead: '像素雪夜互动镜 · 对着镜头做手势，打开专属礼物祝福。',
    assetRoot: 'pixel',
    scrubMagenta: true,
    smoothing: false,
  },
  vintage: {
    id: 'vintage',
    label: '复古明信片',
    labelLatin: 'Vintage Postcard',
    tag: 'VINTAGE POSTCARD',
    brand: '雪夜祝福',
    brandLatin: 'Snow Night Postcard',
    lead: '复古明信片雪夜镜 · 对着镜头做手势，拆开纸上的祝福。',
    assetRoot: 'vintage',
    scrubMagenta: false,
    smoothing: true,
  },
  paper: {
    id: 'paper',
    label: '纸艺立体',
    labelLatin: 'Paper Craft',
    tag: 'PAPER CRAFT LAYERS',
    brand: '雪夜祝福',
    brandLatin: 'Snow Night Paper Craft',
    lead: '纸艺立体雪夜镜 · 对着镜头做手势，翻开层叠纸上的祝福。',
    assetRoot: 'paper',
    scrubMagenta: false,
    smoothing: true,
  },
}

const STORAGE_KEY = 'snow-night-art-style'
const KNOWN = new Set(Object.keys(ART_STYLES))

function normalizeStyleId(raw) {
  const id = String(raw || '').toLowerCase()
  if (id === 'postcard') return 'vintage'
  if (id === 'paper-craft' || id === 'papercraft' || id === '纸艺') return 'paper'
  if (KNOWN.has(id)) return id
  return 'pixel'
}

/** Forced single-style demo host (separate URL per style). */
export function soloStyleId() {
  const raw = (import.meta.env.VITE_SOLO_STYLE || '').toLowerCase()
  if (!raw) return null
  const id = normalizeStyleId(raw)
  return KNOWN.has(id) ? id : null
}

export function resolveArtStyle(search = window.location.search) {
  const solo = soloStyleId()
  if (solo) return ART_STYLES[solo]
  const params = new URLSearchParams(search)
  const fromUrl = (params.get('style') || params.get('art') || '').toLowerCase()
  // URL is source of truth — bare `/` stays pixel (kept build) unless solo.
  return ART_STYLES[normalizeStyleId(fromUrl)]
}

export function persistArtStyle(styleId) {
  const solo = soloStyleId()
  const id = solo || normalizeStyleId(styleId)
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  return id
}

/** Append or replace style= in a URL / search string while keeping gift params. */
export function withStyleParam(urlOrSearch, styleId) {
  const solo = soloStyleId()
  const id = solo || normalizeStyleId(styleId)
  let url
  try {
    url = new URL(urlOrSearch, window.location.origin)
  } catch {
    const params = new URLSearchParams(
      String(urlOrSearch).startsWith('?') ? urlOrSearch.slice(1) : urlOrSearch,
    )
    // Solo hosts: no style query — this host IS the style.
    if (solo || id === 'pixel') params.delete('style')
    else params.set('style', id)
    const q = params.toString()
    return q ? `?${q}` : '?'
  }
  if (solo || id === 'pixel') url.searchParams.delete('style')
  else url.searchParams.set('style', id)
  return `${url.pathname}${url.search}${url.hash}`
}

export function styleHomeHref(styleId, base = import.meta.env.BASE_URL) {
  const root = base.endsWith('/') ? base : `${base}/`
  const solo = soloStyleId()
  if (solo) return root
  const id = normalizeStyleId(styleId)
  if (id === 'pixel') return root
  return `${root}?style=${id}`
}
