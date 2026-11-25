/**
 * Pixel-art sprite loader (Stardew-like). Draws with nearest-neighbor scaling.
 */

const cache = new Map()

/** Strip magenta/purple chroma fringe after load (gift sprites). */
function scrubMagentaCanvas(img) {
  try {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth || img.width
    c.height = img.naturalHeight || img.height
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    const frame = ctx.getImageData(0, 0, c.width, c.height)
    const d = frame.data
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]
      const g = d[i + 1]
      const b = d[i + 2]
      const a = d[i + 3]
      if (a < 8) continue
      const magenta = r > 90 && b > 80 && g < 130 && b > g && r > g && Math.abs(r - b) < 95
      const hot = r > 160 && b > 160 && g < 140
      if (magenta || hot) {
        d[i + 3] = 0
        continue
      }
      // pull purple shade toward maroon
      if (b > g + 8 && r > g && b > 50 && !(r > 150 && g > 110 && b < 100)) {
        if (r > b + 40 && r > 100) d[i + 2] = Math.min(b, g + 5)
        else if (r > 60) {
          d[i] = Math.max(r, 90)
          d[i + 1] = Math.min(g, 30)
          d[i + 2] = Math.min(b, 25)
        } else d[i + 3] = 0
      }
    }
    ctx.putImageData(frame, 0, 0)
    const out = new Image()
    out.src = c.toDataURL('image/png')
    return new Promise((resolve) => {
      out.onload = () => resolve(out)
      out.onerror = () => resolve(img)
    })
  } catch {
    return Promise.resolve(img)
  }
}

export function loadImage(src, { scrubMagenta = false } = {}) {
  const key = scrubMagenta ? `${src}#scrub` : src
  if (cache.has(key)) return cache.get(key)
  const p = new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (scrubMagenta) scrubMagentaCanvas(img).then(resolve)
      else resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
  cache.set(key, p)
  return p
}

export const PIXEL = {
  guideSnow: '/pixel/guide-snow.jpg?v=51',
  guideGift: '/pixel/guide-gift.jpg?v=51',
  guideBell: '/pixel/guide-bell.jpg?v=51',
  guideAntlers: '/pixel/guide-antlers.jpg?v=51',
  guideHat: '/pixel/guide-hat.jpg?v=51',
  guideNext: '/pixel/guide-next.jpg?v=51',
  guideTree: '/pixel/guide-tree.jpg?v=51',
  santaHat: '/pixel/santa-hat.png?v=3',
  antlers: '/pixel/antlers.png?v=2',
  gift: '/pixel/gift.png?v=52',
  giftBox: '/pixel/gift-box.png?v=52',
  giftLid: '/pixel/gift-lid.png?v=52',
  bell: '/pixel/bell.png',
  tree: '/pixel/tree.png?v=49',
}

export async function preloadPixelAssets() {
  await Promise.all(Object.values(PIXEL).map(loadImage))
}

export function drawPixelSprite(ctx, img, x, y, w, h, opts = {}) {
  if (!img) return
  const { anchorX = 0.5, anchorY = 0.5, flipX = false, alpha = 1 } = opts
  ctx.save()
  ctx.imageSmoothingEnabled = false
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
