/**
 * Art style resolver — theme (Christmas) × art style (pixel | vintage | neon).
 * Default remains pixel so the kept build is unchanged.
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
  neon: {
    id: 'neon',
    label: '霓虹',
    labelLatin: 'Neon Glow',
    tag: 'NEON SNOW NIGHT',
    brand: '雪夜祝福',
    brandLatin: 'Neon Night Mirror',
    lead: '霓虹雪夜互动镜 · 对着镜头做手势，点亮专属礼物祝福。',
    assetRoot: 'neon',
    scrubMagenta: false,
    smoothing: true,
  },
}

const STORAGE_KEY = 'snow-night-art-style'
const KNOWN = new Set(Object.keys(ART_STYLES))

function normalizeStyleId(raw) {
  const id = String(raw || '').toLowerCase()
  if (id === 'postcard') return 'vintage'
  if (KNOWN.has(id)) return id
  return 'pixel'
}

export function resolveArtStyle(search = window.location.search) {
  const params = new URLSearchParams(search)
  const fromUrl = (params.get('style') || params.get('art') || '').toLowerCase()
  // URL is source of truth. Bare `/` stays pixel unless VITE_DEFAULT_STYLE is set (preview tunnels).
  if (fromUrl) return ART_STYLES[normalizeStyleId(fromUrl)]
  const envDefault = String(import.meta.env.VITE_DEFAULT_STYLE || '').toLowerCase()
  if (envDefault && ART_STYLES[normalizeStyleId(envDefault)]) {
    return ART_STYLES[normalizeStyleId(envDefault)]
  }
  return ART_STYLES.pixel
}

export function persistArtStyle(styleId) {
  const id = normalizeStyleId(styleId)
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  return id
}

/** Append or replace style= in a URL / search string while keeping gift params. */
export function withStyleParam(urlOrSearch, styleId) {
  const id = normalizeStyleId(styleId)
  let url
  try {
    url = new URL(urlOrSearch, window.location.origin)
  } catch {
    const params = new URLSearchParams(
      String(urlOrSearch).startsWith('?') ? urlOrSearch.slice(1) : urlOrSearch,
    )
    if (id === 'pixel') params.delete('style')
    else params.set('style', id)
    const q = params.toString()
    return q ? `?${q}` : '?'
  }
  if (id === 'pixel') url.searchParams.delete('style')
  else url.searchParams.set('style', id)
  return `${url.pathname}${url.search}${url.hash}`
}

export function styleHomeHref(styleId, base = import.meta.env.BASE_URL) {
  const root = base.endsWith('/') ? base : `${base}/`
  const id = normalizeStyleId(styleId)
  if (id === 'pixel') return root
  return `${root}?style=${id}`
}
