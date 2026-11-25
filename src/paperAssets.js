/**
 * Paper-craft / 纸艺立体 art pack — same Christmas slots as pixel, smooth draw + soft shadows in assets.
 */
import { loadImage } from './pixelAssets.js'

const BASE = import.meta.env.BASE_URL
const P = `${BASE}paper`

export const PAPER = {
  guideSnow: `${P}/guide-snow.jpg?v=3`,
  guideGift: `${P}/guide-gift.jpg?v=3`,
  guideBell: `${P}/guide-bell.jpg?v=3`,
  guideAntlers: `${P}/guide-antlers.jpg?v=3`,
  guideHat: `${P}/guide-hat.jpg?v=3`,
  guideNext: `${P}/guide-next.jpg?v=3`,
  guideTree: `${P}/guide-tree.jpg?v=3`,
  santaHat: `${P}/santa-hat.png?v=3`,
  antlers: `${P}/antlers.png?v=3`,
  gift: `${P}/gift.png?v=3`,
  giftBox: `${P}/gift-box.png?v=3`,
  giftLid: `${P}/gift-lid.png?v=3`,
  bell: `${P}/bell.png?v=3`,
  tree: `${P}/tree.png?v=3`,
  bow: `${P}/bow.png?v=3`,
  ornament: `${P}/ornament.png?v=3`,
  star: `${P}/star.png?v=3`,
  snowflake: `${P}/snowflake.png?v=3`,
  heroPaper: `${P}/hero-paper.jpg?v=3`,
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
