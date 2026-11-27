/**
 * Vintage postcard art pack — same Christmas slots as pixel, smooth draw.
 */
import { loadImage } from './pixelAssets.js'

const BASE = import.meta.env.BASE_URL
const V = `${BASE}vintage`
const VER = '14'

export const VINTAGE = {
  guideSnow: `${V}/guide-snow.jpg?v=${VER}`,
  guideGift: `${V}/guide-gift.jpg?v=${VER}`,
  guideBell: `${V}/guide-bell.jpg?v=${VER}`,
  guideAntlers: `${V}/guide-antlers.jpg?v=${VER}`,
  guideHat: `${V}/guide-hat.jpg?v=${VER}`,
  guideNext: `${V}/guide-next.jpg?v=${VER}`,
  guideTree: `${V}/guide-tree.jpg?v=${VER}`,
  santaHat: `${V}/santa-hat.png?v=${VER}`,
  antlers: `${V}/antlers.png?v=${VER}`,
  gift: `${V}/gift.png?v=${VER}`,
  giftBox: `${V}/gift-box.png?v=${VER}`,
  giftLid: `${V}/gift-lid.png?v=${VER}`,
  bell: `${V}/bell.png?v=${VER}`,
  tree: `${V}/tree.png?v=${VER}`,
  wreath: `${V}/wreath.png?v=${VER}`,
  candle: `${V}/candle.png?v=${VER}`,
  stamp: `${V}/stamp.png?v=${VER}`,
  bow: `${V}/bow.png?v=${VER}`,
  snowflake: `${V}/snowflake.png?v=${VER}`,
  heroPostcard: `${V}/hero-postcard.jpg?v=${VER}`,
}

export async function preloadVintageAssets() {
  await Promise.all(Object.values(VINTAGE).map((src) => loadImage(src)))
}

/** Smooth bilinear sprite draw for postcard art (not pixelated). */
export function drawVintageSprite(ctx, img, x, y, w, h, opts = {}) {
  if (!img) return
  const { anchorX = 0.5, anchorY = 0.5, flipX = false, alpha = 1 } = opts
  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.globalAlpha = alpha
  const dx = x - w * anchorX
  const dy = y - h * anchorY
  if (flipX) {
    ctx.translate(x, y)
    ctx.scale(-1, 1)
    ctx.drawImage(img, -w * anchorX, -h * anchorY, w, h)
  } else {
    ctx.drawImage(img, dx, dy, w, h)
  }
  ctx.restore()
}
