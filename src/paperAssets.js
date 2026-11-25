/**
 * Paper-craft / 纸艺立体 art pack — same Christmas slots as pixel, smooth draw + soft shadows in assets.
 */
import { loadImage } from './pixelAssets.js'

const BASE = import.meta.env.BASE_URL
const P = `${BASE}paper`

export const PAPER = {
  guideSnow: `${P}/guide-snow.jpg?v=2`,
  guideGift: `${P}/guide-gift.jpg?v=2`,
  guideBell: `${P}/guide-bell.jpg?v=2`,
  guideAntlers: `${P}/guide-antlers.jpg?v=2`,
  guideHat: `${P}/guide-hat.jpg?v=2`,
  guideNext: `${P}/guide-next.jpg?v=2`,
  guideTree: `${P}/guide-tree.jpg?v=2`,
  santaHat: `${P}/santa-hat.png?v=2`,
  antlers: `${P}/antlers.png?v=2`,
  gift: `${P}/gift.png?v=2`,
  giftBox: `${P}/gift-box.png?v=2`,
  giftLid: `${P}/gift-lid.png?v=2`,
  bell: `${P}/bell.png?v=2`,
  tree: `${P}/tree.png?v=2`,
  bow: `${P}/bow.png?v=2`,
  ornament: `${P}/ornament.png?v=2`,
  star: `${P}/star.png?v=2`,
  snowflake: `${P}/snowflake.png?v=2`,
  heroPaper: `${P}/hero-paper.jpg?v=2`,
}

export async function preloadPaperAssets() {
  await Promise.all(Object.values(PAPER).map((src) => loadImage(src)))
}

/** Smooth bilinear sprite draw for layered paper art. */
export function drawPaperSprite(ctx, img, x, y, w, h, opts = {}) {
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
