/**
 * Vintage postcard art pack — same Christmas slots as pixel, smooth draw.
 */
import { loadImage } from './pixelAssets.js'

const BASE = import.meta.env.BASE_URL
const V = `${BASE}vintage`

export const VINTAGE = {
  guideSnow: `${V}/guide-snow.jpg?v=18`,
  guideGift: `${V}/guide-gift.jpg?v=18`,
  guideBell: `${V}/guide-bell.jpg?v=18`,
  guideAntlers: `${V}/guide-antlers.jpg?v=18`,
  guideHat: `${V}/guide-hat.jpg?v=18`,
  guideNext: `${V}/guide-next.jpg?v=18`,
  guideTree: `${V}/guide-tree.jpg?v=18`,
  santaHat: `${V}/santa-hat.png?v=4`,
  antlers: `${V}/antlers.png?v=4`,
  gift: `${V}/gift.png?v=4`,
  giftBox: `${V}/gift-box.png?v=4`,
  giftLid: `${V}/gift-lid.png?v=4`,
  bell: `${V}/bell.png?v=4`,
  tree: `${V}/tree.png?v=4`,
  wreath: `${V}/wreath.png?v=4`,
  candle: `${V}/candle.png?v=4`,
  stamp: `${V}/stamp.png?v=4`,
  bow: `${V}/bow.png?v=4`,
  heroPostcard: `${V}/hero-postcard.jpg?v=4`,
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
