/**
 * Paper-craft / 纸艺立体 art pack — same Christmas slots as pixel, smooth draw + soft shadows in assets.
 */
import { loadImage } from './pixelAssets.js'

const BASE = import.meta.env.BASE_URL
const P = `${BASE}paper`
const VER = '23'

export const PAPER = {
  guideSnow: `${P}/guide-snow.jpg?v=${VER}`,
  guideGift: `${P}/guide-gift.jpg?v=${VER}`,
  guideBell: `${P}/guide-bell.jpg?v=${VER}`,
  guideAntlers: `${P}/guide-antlers.jpg?v=${VER}`,
  guideHat: `${P}/guide-hat.jpg?v=${VER}`,
  guideNext: `${P}/guide-next.jpg?v=${VER}`,
  guideTree: `${P}/guide-tree.jpg?v=${VER}`,
  santaHat: `${P}/santa-hat.png?v=${VER}`,
  antlers: `${P}/antlers.png?v=${VER}`,
  gift: `${P}/gift.png?v=${VER}`,
  giftBox: `${P}/gift-box.png?v=${VER}`,
  giftLid: `${P}/gift-lid.png?v=${VER}`,
  bell: `${P}/bell.png?v=${VER}`,
  tree: `${P}/tree.png?v=${VER}`,
  bow: `${P}/bow.png?v=${VER}`,
  ornament: `${P}/ornament.png?v=${VER}`,
  star: `${P}/star.png?v=${VER}`,
  snowflake: `${P}/snowflake.png?v=${VER}`,
  snowflakeB: `${P}/snowflake-b.png?v=${VER}`,
  snowflakeC: `${P}/snowflake-c.png?v=${VER}`,
  heroPaper: `${P}/hero-paper.jpg?v=${VER}`,
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
