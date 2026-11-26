/**
 * Solo vintage host — this deployment is locked to vintage postcard only.
 * No cross-style chips / ?style= switching.
 */

export const ART_STYLES = {
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

/** Forced single-style demo host. */
export function soloStyleId() {
  return 'vintage'
}

export function resolveArtStyle() {
  return ART_STYLES.vintage
}

export function persistArtStyle() {
  try {
    localStorage.setItem(STORAGE_KEY, 'vintage')
  } catch {
    /* ignore */
  }
  return 'vintage'
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
