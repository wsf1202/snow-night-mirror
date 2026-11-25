/** Gift customization via URL params + light localStorage fallback. */

export const BOX_STYLES = [
  { id: 'red-gold', label: '红盒金带', ribbon: '#c9a227', box: '#9b1b1b' },
  { id: 'green-gold', label: '绿盒金带', ribbon: '#c9a227', box: '#1f5c3a' },
  { id: 'navy-silver', label: '深蓝银带', ribbon: '#c5cdd8', box: '#1a2744' },
  { id: 'cream-red', label: '奶油红带', ribbon: '#9b1b1b', box: '#f2e6d0' },
]

export const DEFAULT_GIFT = {
  blessing: '圣诞快乐！',
  signature: '',
  box: 'red-gold',
  hint: '双手比心，打开专属礼物',
}

const MAX_BLESSING = 40
const MAX_SIGNATURE = 20

export function clampBlessing(text) {
  return String(text ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_BLESSING)
}

export function clampSignature(text) {
  return String(text ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_SIGNATURE)
}

export function resolveBox(id) {
  return BOX_STYLES.find((b) => b.id === id) || BOX_STYLES[0]
}

/**
 * Read gift config from URL search params, then localStorage.
 * Params: b=blessing, s=signature, box=style id, h=hint
 */
export function readGiftConfig(search = window.location.search) {
  const params = new URLSearchParams(search)
  let blessing = params.get('b') ?? params.get('blessing')
  let signature = params.get('s') ?? params.get('sig') ?? params.get('signature')
  let box = params.get('box')
  let hint = params.get('h') ?? params.get('hint')

  if (blessing == null && signature == null && box == null) {
    try {
      const raw = localStorage.getItem('snow-night-gift')
      if (raw) {
        const saved = JSON.parse(raw)
        blessing = saved.blessing
        signature = saved.signature
        box = saved.box
        hint = saved.hint
      }
    } catch {
      /* ignore */
    }
  }

  return {
    blessing: clampBlessing(blessing ?? DEFAULT_GIFT.blessing) || DEFAULT_GIFT.blessing,
    signature: clampSignature(signature ?? DEFAULT_GIFT.signature),
    box: resolveBox(box ?? DEFAULT_GIFT.box).id,
    hint: clampBlessing(hint ?? DEFAULT_GIFT.hint) || DEFAULT_GIFT.hint,
  }
}

export function buildGiftSearchParams(config) {
  const params = new URLSearchParams()
  const blessing = clampBlessing(config.blessing) || DEFAULT_GIFT.blessing
  const signature = clampSignature(config.signature)
  const box = resolveBox(config.box).id
  params.set('b', blessing)
  if (signature) params.set('s', signature)
  if (box !== DEFAULT_GIFT.box) params.set('box', box)
  return params
}

export function buildShareUrl(
  config,
  origin = window.location.origin,
  { style, basePath } = {},
) {
  const params = buildGiftSearchParams(config)
  const styleId = style || new URLSearchParams(window.location.search).get('style')
  if (styleId === 'vintage' || styleId === 'neon') params.set('style', styleId)
  const base =
    basePath != null
      ? basePath
      : `${import.meta.env.BASE_URL}`.replace(/\/?$/, '/')
  const path = base.startsWith('http') ? base : `${origin}${base}`
  return `${path}?${params.toString()}`
}

export function persistGiftConfig(config) {
  const payload = {
    blessing: clampBlessing(config.blessing) || DEFAULT_GIFT.blessing,
    signature: clampSignature(config.signature),
    box: resolveBox(config.box).id,
    hint: clampBlessing(config.hint ?? DEFAULT_GIFT.hint) || DEFAULT_GIFT.hint,
  }
  try {
    localStorage.setItem('snow-night-gift', JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
  return payload
}

export { MAX_BLESSING, MAX_SIGNATURE }
