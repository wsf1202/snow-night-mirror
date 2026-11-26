/**
 * Solo paper-craft host — this deployment is locked to paper only.
 * No cross-style chips / ?style= switching.
 */

export const ART_STYLES = {
  paper: {
    id: 'paper',
    label: '纸艺立体',
    labelLatin: 'Paper Craft',
    tag: 'PAPER CRAFT LAYERS',
    brand: '雪夜祝福',
    brandLatin: 'Snow Night Paper Craft',
    lead: '对着镜头做手势，翻开层叠纸上的祝福。',
    assetRoot: 'paper',
    scrubMagenta: false,
    smoothing: true,
  },
}

const STORAGE_KEY = 'snow-night-art-style'

/** Forced single-style demo host. */
export function soloStyleId() {
  return 'paper'
}

export function resolveArtStyle() {
  return ART_STYLES.paper
}

export function persistArtStyle() {
  try {
    localStorage.setItem(STORAGE_KEY, 'paper')
  } catch {
    /* ignore */
  }
  return 'paper'
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
