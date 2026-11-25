var BOX_STYLES = [
  { id: 'red-gold', label: '红盒金带', ribbon: '#c9a227', box: '#9b1b1b' },
  { id: 'green-gold', label: '绿盒金带', ribbon: '#c9a227', box: '#1f5c3a' },
  { id: 'navy-silver', label: '深蓝银带', ribbon: '#c5cdd8', box: '#1a2744' },
  { id: 'cream-red', label: '奶油红带', ribbon: '#9b1b1b', box: '#f2e6d0' },
]

var DEFAULT_GIFT = {
  blessing: '圣诞快乐！',
  signature: '',
  box: 'red-gold',
  hint: '双手比心，打开专属礼物',
}

var MAX_BLESSING = 40
var MAX_SIGNATURE = 20
var STORAGE_KEY = 'snow-night-gift'

/** 空值合并（不用 ES2020 空值合并运算符，避免老版 Uglify 压缩失败） */
function coalesce(a, b) {
  return a != null ? a : b
}

function clampBlessing(text) {
  return String(coalesce(text, ''))
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_BLESSING)
}

function clampSignature(text) {
  return String(coalesce(text, ''))
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_SIGNATURE)
}

/** 与 slice 一致按 UTF-16 码元计数 */
function textLen(text) {
  return String(coalesce(text, '')).length
}

function resolveBox(id) {
  for (var i = 0; i < BOX_STYLES.length; i++) {
    if (BOX_STYLES[i].id === id) return BOX_STYLES[i]
  }
  return BOX_STYLES[0]
}

function readGiftConfig(query) {
  var blessing
  var signature
  var box
  var hint

  if (query && (query.b || query.blessing || query.s || query.box)) {
    blessing = coalesce(query.b, query.blessing)
    signature = coalesce(query.s, coalesce(query.sig, query.signature))
    box = query.box
    hint = coalesce(query.h, query.hint)
  } else {
    try {
      var raw = wx.getStorageSync(STORAGE_KEY)
      if (raw) {
        var saved = typeof raw === 'string' ? JSON.parse(raw) : raw
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
    blessing: clampBlessing(coalesce(blessing, DEFAULT_GIFT.blessing)) || DEFAULT_GIFT.blessing,
    signature: clampSignature(coalesce(signature, DEFAULT_GIFT.signature)),
    box: resolveBox(coalesce(box, DEFAULT_GIFT.box)).id,
    hint: clampBlessing(coalesce(hint, DEFAULT_GIFT.hint)) || DEFAULT_GIFT.hint,
  }
}

function persistGiftConfig(config) {
  var payload = {
    blessing: clampBlessing(config.blessing) || DEFAULT_GIFT.blessing,
    signature: clampSignature(config.signature),
    box: resolveBox(config.box).id,
    hint: clampBlessing(coalesce(config.hint, DEFAULT_GIFT.hint)) || DEFAULT_GIFT.hint,
  }
  try {
    wx.setStorageSync(STORAGE_KEY, payload)
  } catch (e) {
    // ignore quota
  }
  var app = getApp()
  if (app && app.globalData) {
    app.globalData.gift = payload
  }
  return payload
}

/** 小程序内跳转参数（非 H5 URL） */
function buildShareQuery(config) {
  var blessing = clampBlessing(config.blessing) || DEFAULT_GIFT.blessing
  var signature = clampSignature(config.signature)
  var box = resolveBox(config.box).id
  var parts = ['b=' + encodeURIComponent(blessing)]
  if (signature) parts.push('s=' + encodeURIComponent(signature))
  if (box !== DEFAULT_GIFT.box) parts.push('box=' + encodeURIComponent(box))
  return parts.join('&')
}

module.exports = {
  BOX_STYLES: BOX_STYLES,
  DEFAULT_GIFT: DEFAULT_GIFT,
  MAX_BLESSING: MAX_BLESSING,
  MAX_SIGNATURE: MAX_SIGNATURE,
  STORAGE_KEY: STORAGE_KEY,
  clampBlessing: clampBlessing,
  clampSignature: clampSignature,
  textLen: textLen,
  resolveBox: resolveBox,
  readGiftConfig: readGiftConfig,
  persistGiftConfig: persistGiftConfig,
  buildShareQuery: buildShareQuery,
}
