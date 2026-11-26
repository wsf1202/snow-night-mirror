/**
 * Solo pixel host — this deployment is locked to pixel only.
 * No cross-style chips / ?style= switching.
 */

export const ART_STYLES = {
  pixel: {
    id: 'pixel',
    label: '像素雪夜',
    labelLatin: 'Pixel Snow Night',
    tag: 'PIXEL SNOW NIGHT',
    brand: '雪夜祝福',
    brandLatin: 'Snow Night Mirror',
    lead: '对着镜头做手势，打开专属礼物祝福。',
    assetRoot: 'pixel',
    scrubMagenta: true,
    smoothing: false,
  },
}

const STORAGE_KEY = 'snow-night-art-style'

/** Forced single-style demo host. */
export function soloStyleId() {
  return 'pixel'
}

export function resolveArtStyle() {
  return ART_STYLES.pixel
}

export function persistArtStyle() {
  try {
    localStorage.setItem(STORAGE_KEY, 'pixel')
  } catch {
    /* ignore */
  }
  return 'pixel'
}

/** Solo hosts: never append style= — this host IS the style. */
export function withStyleParam(urlOrSearch) {
  let url
  try {
    url = new URL(urlOrSearch, window.location.origin)
  } catch {
    const params = new URLSearchParams(
      String(urlOrSearch).startsWith('?') ? urlOrSearch.slice(1) : urlOrSearch,
    )
    params.delete('style')
    const q = params.toString()
    return q ? `?${q}` : '?'
  }
  url.searchParams.delete('style')
  return `${url.pathname}${url.search}${url.hash}`
}

export function styleHomeHref(_styleId, base = import.meta.env.BASE_URL) {
  const root = base.endsWith('/') ? base : `${base}/`
  return root
}
