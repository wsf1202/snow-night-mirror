/**
 * Neon Christmas art pack — same Christmas slots as pixel/vintage, smooth glow draw.
 */
import { loadImage } from './pixelAssets.js'

const BASE = import.meta.env.BASE_URL
const N = `${BASE}neon`
const VER = '6'
const FLAKE_VER = '4'

export const NEON = {
  guideSnow: `${N}/guide-snow.jpg?v=${VER}`,
  guideGift: `${N}/guide-gift.jpg?v=${VER}`,
  guideBell: `${N}/guide-bell.jpg?v=${VER}`,
  guideAntlers: `${N}/guide-antlers.jpg?v=${VER}`,
  guideHat: `${N}/guide-hat.jpg?v=${VER}`,
  guideNext: `${N}/guide-next.jpg?v=${VER}`,
  guideTree: `${N}/guide-tree.jpg?v=${VER}`,
  santaHat: `${N}/santa-hat.png?v=${VER}`,
  antlers: `${N}/antlers.png?v=${VER}`,
  gift: `${N}/gift.png?v=${VER}`,
  giftBox: `${N}/gift-box.png?v=${VER}`,
  giftLid: `${N}/gift-lid.png?v=${VER}`,
  bell: `${N}/bell.png?v=${VER}`,
  tree: `${N}/tree.png?v=${VER}`,
  snowflake: `${N}/snowflake.png?v=${FLAKE_VER}`,
  snowflakeB: `${N}/snowflake-b.png?v=${FLAKE_VER}`,
  snowflakeC: `${N}/snowflake-c.png?v=${FLAKE_VER}`,
  heroNeon: `${N}/hero-neon.jpg?v=${VER}`,
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
