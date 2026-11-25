/**
 * Neon Christmas art pack — same Christmas slots as pixel/vintage, smooth glow draw.
 */
import { loadImage } from './pixelAssets.js'

const BASE = import.meta.env.BASE_URL
const N = `${BASE}neon`

export const NEON = {
  guideSnow: `${N}/guide-snow.jpg?v=3`,
  guideGift: `${N}/guide-gift.jpg?v=3`,
  guideBell: `${N}/guide-bell.jpg?v=3`,
  guideAntlers: `${N}/guide-antlers.jpg?v=3`,
  guideHat: `${N}/guide-hat.jpg?v=3`,
  guideNext: `${N}/guide-next.jpg?v=3`,
  guideTree: `${N}/guide-tree.jpg?v=3`,
  santaHat: `${N}/santa-hat.png?v=3`,
  antlers: `${N}/antlers.png?v=3`,
  gift: `${N}/gift.png?v=3`,
  giftBox: `${N}/gift-box.png?v=3`,
  giftLid: `${N}/gift-lid.png?v=3`,
  bell: `${N}/bell.png?v=3`,
  tree: `${N}/tree.png?v=3`,
  heroNeon: `${N}/hero-neon.jpg?v=3`,
}

export async function preloadNeonAssets() {
  await Promise.all(Object.values(NEON).map((src) => loadImage(src)))
}

/** Smooth bilinear sprite draw for neon glow art. */
export function drawNeonSprite(ctx, img, x, y, w, h, opts = {}) {
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
