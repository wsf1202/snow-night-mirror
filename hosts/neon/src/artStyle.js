/**
 * Solo neon host — this deployment is locked to neon only.
 * No cross-style chips / ?style= switching.
 */

export const ART_STYLES = {
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

/** Forced single-style demo host. */
export function soloStyleId() {
  return 'neon'
}

export function resolveArtStyle() {
  return ART_STYLES.neon
}

export function persistArtStyle() {
  try {
    localStorage.setItem(STORAGE_KEY, 'neon')
  } catch {
    /* ignore */
  }
  return 'neon'
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
