/**
 * Art style resolver — theme (Christmas) × art style (pixel | vintage).
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
}

const STORAGE_KEY = 'snow-night-art-style'

export function resolveArtStyle(search = window.location.search) {
  const params = new URLSearchParams(search)
  const fromUrl = (params.get('style') || params.get('art') || '').toLowerCase()
  // URL is source of truth — bare `/` stays pixel (kept build).
  if (fromUrl === 'vintage' || fromUrl === 'postcard') return ART_STYLES.vintage
  if (fromUrl === 'pixel') return ART_STYLES.pixel
  return ART_STYLES.pixel
}

export function persistArtStyle(styleId) {
  const id = styleId === 'vintage' ? 'vintage' : 'pixel'
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  return id
}

/** Append or replace style= in a URL / search string while keeping gift params. */
export function withStyleParam(urlOrSearch, styleId) {
  const id = styleId === 'vintage' ? 'vintage' : 'pixel'
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
  if (styleId === 'vintage') return `${root}?style=vintage`
  return root
}
