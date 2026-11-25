const BOX_STYLES = [
  { id: 'red-gold', label: '红盒金带', ribbon: '#c9a227', box: '#9b1b1b' },
  { id: 'green-gold', label: '绿盒金带', ribbon: '#c9a227', box: '#1f5c3a' },
  { id: 'navy-silver', label: '深蓝银带', ribbon: '#c5cdd8', box: '#1a2744' },
  { id: 'cream-red', label: '奶油红带', ribbon: '#9b1b1b', box: '#f2e6d0' },
]

const DEFAULT_GIFT = {
  blessing: '圣诞快乐！',
  signature: '',
  box: 'red-gold',
  hint: '双手比心，打开专属礼物',
}

const MAX_BLESSING = 40
const MAX_SIGNATURE = 20
const STORAGE_KEY = 'snow-night-gift'

function clampBlessing(text) {
  return String(text ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_BLESSING)
}

function clampSignature(text) {
  return String(text ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_SIGNATURE)
}

function resolveBox(id) {
  return BOX_STYLES.find((b) => b.id === id) || BOX_STYLES[0]
}

function readGiftConfig(query) {
  let blessing
  let signature
  let box
  let hint

  if (query && (query.b || query.blessing || query.s || query.box)) {
    blessing = query.b ?? query.blessing
    signature = query.s ?? query.sig ?? query.signature
    box = query.box
    hint = query.h ?? query.hint
  } else {
    try {
      const raw = wx.getStorageSync(STORAGE_KEY)
      if (raw) {
        const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
        blessing = saved.blessing
        signature = saved.signature
        box = saved.box
        hint = saved.hint
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    blessing: clampBlessing(blessing ?? DEFAULT_GIFT.blessing) || DEFAULT_GIFT.blessing,
    signature: clampSignature(signature ?? DEFAULT_GIFT.signature),
    box: resolveBox(box ?? DEFAULT_GIFT.box).id,
    hint: clampBlessing(hint ?? DEFAULT_GIFT.hint) || DEFAULT_GIFT.hint,
  }
}

function persistGiftConfig(config) {
  const payload = {
    blessing: clampBlessing(config.blessing) || DEFAULT_GIFT.blessing,
    signature: clampSignature(config.signature),
    box: resolveBox(config.box).id,
    hint: clampBlessing(config.hint ?? DEFAULT_GIFT.hint) || DEFAULT_GIFT.hint,
  }
  try {
    wx.setStorageSync(STORAGE_KEY, payload)
  } catch (e) {
    // ignore quota
  }
  const app = getApp()
  if (app && app.globalData) {
    app.globalData.gift = payload
  }
  return payload
}

/** 小程序内跳转参数（非 H5 URL） */
function buildShareQuery(config) {
  const blessing = clampBlessing(config.blessing) || DEFAULT_GIFT.blessing
  const signature = clampSignature(config.signature)
  const box = resolveBox(config.box).id
  const parts = [`b=${encodeURIComponent(blessing)}`]
  if (signature) parts.push(`s=${encodeURIComponent(signature)}`)
  if (box !== DEFAULT_GIFT.box) parts.push(`box=${encodeURIComponent(box)}`)
  return parts.join('&')
}

module.exports = {
  BOX_STYLES,
  DEFAULT_GIFT,
  MAX_BLESSING,
  MAX_SIGNATURE,
  STORAGE_KEY,
  clampBlessing,
  clampSignature,
  resolveBox,
  readGiftConfig,
  persistGiftConfig,
  buildShareQuery,
}
