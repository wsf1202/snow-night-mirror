import { resolveBox } from './gift.js'
import {
  playBell,
  playGiftOpen,
  playSparkle,
  playWhoosh,
  playWarm,
  playTree,
} from './audio.js'
import { PIXEL, loadImage, drawPixelSprite } from './pixelAssets.js'

/** Solo pixel host — locked. */
let ART = PIXEL
let drawSprite = drawPixelSprite
let scrubSprites = true
let artStyleId = 'pixel'

/** Swap Christmas art style without forking the effect state machine. */
/** Solo pixel host — locked. */
export function configureEffectsArt(_styleId = 'pixel') {
  artStyleId = 'pixel'
  ART = PIXEL
  drawSprite = drawPixelSprite
  scrubSprites = true
}

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function nx(pt, w, fallback) {
  if (!pt || pt.x == null) return fallback
  return pt.x * w
}

function ny(pt, h, fallback) {
  if (!pt || pt.y == null) return fallback
  return pt.y * h
}

/**
 * Christmas effects with finger-anchored props.
 */
export class EffectsEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.w = 0
    this.h = 0
    this.dpr = 1
    this.snow = []
    this.snowBoostUntil = 0
    this.snowPalm = null
    this.particles = []
    this.gift = null
    this.bell = null
    this.candy = null
    this.reindeer = null
    this.fireplace = null
    this.tree = null
    this.live = {}
    this.unlocked = new Set()
    this.listeners = new Set()
    this.sprites = {
      hat: null,
      antlers: null,
      gift: null,
      giftBox: null,
      giftLid: null,
      bell: null,
      tree: null,
      snowflake: null,
      snowflakes: [],
    }
    /** Separate timers — only after their own gestures */
    this.hatUntil = 0
    this.antlersUntil = 0
    this._seedAmbientSnow(48)
    this._loadSprites()
  }

  async _loadSprites() {
    const scrub = scrubSprites
    this.sprites.hat = await loadImage(ART.santaHat)
    this.sprites.antlers = await loadImage(ART.antlers)
    this.sprites.gift = await loadImage(ART.gift, { scrubMagenta: scrub })
    this.sprites.giftBox = await loadImage(ART.giftBox, { scrubMagenta: scrub })
    this.sprites.giftLid = await loadImage(ART.giftLid, { scrubMagenta: scrub })
    this.sprites.bell = await loadImage(ART.bell)
    this.sprites.tree = await loadImage(ART.tree, { scrubMagenta: scrub })
    this.sprites.snowflake = ART.snowflake ? await loadImage(ART.snowflake) : null
    const flakeSrcs = [ART.snowflake, ART.snowflakeB, ART.snowflakeC].filter(Boolean)
    this.sprites.snowflakes = (
      await Promise.all(flakeSrcs.map((src) => loadImage(src)))
    ).filter(Boolean)
  }

  /** Reload sprites after art pack swap (before stage starts). */
  async reloadArtSprites() {
    await this._loadSprites()
  }

  onUnlock(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  _markUnlocked(id) {
    if (this.unlocked.has(id)) return
    this.unlocked.add(id)
    for (const fn of this.listeners) fn(id, [...this.unlocked])
  }

  /** Per-frame hand anchors (normalized). */
  setLiveAnchors(anchors) {
    this.live = anchors || {}
  }

  resize(cssW, cssH) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = cssW
    this.h = cssH
    this.canvas.width = Math.floor(cssW * this.dpr)
    this.canvas.height = Math.floor(cssH * this.dpr)
    this.canvas.style.width = `${cssW}px`
    this.canvas.style.height = `${cssH}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  _seedAmbientSnow(n) {
    this.snow = Array.from({ length: n }, () => this._makeFlake(true))
  }

  _makeFlake(full = false, near = null, sticky = false) {
    const w = this.w || 800
    const h = this.h || 600
    const x0 = near ? near.x * w : rand(0, w)
    const y0 = near ? near.y * h : full ? rand(0, h) : rand(-40, 0)
    // Neon / paper: slightly softer base alpha; neon ≤8% get a flash pulse in draw
    const neon = artStyleId === 'neon'
    const paper = artStyleId === 'paper'
    const soft = neon || paper
    return {
      x: near ? x0 + rand(-50, 50) : x0,
      y: near && !full ? y0 + rand(-30, 20) : y0,
      r: soft ? rand(1.0, 2.8) : rand(1.2, 3.6),
      vy: rand(0.45, 1.7),
      vx: rand(-0.35, 0.35),
      a: soft ? rand(0.28, 0.62) : rand(0.4, 0.95),
      wobble: rand(0, Math.PI * 2),
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.02, 0.02),
      flash: neon && Math.random() < 0.08,
      sticky,
      born: performance.now(),
    }
  }

  triggerSnowBlessing(payload = {}) {
    const palms = payload.palms?.length
      ? payload.palms
      : [payload.palm || this.live.palm || null]
    this.snowPalm = palms[0] || null
    const now = performance.now()
    const refreshing = now < this.snowBoostUntil
    this.snowBoostUntil = now + 5500
    // Per-hand burst — both hands can snow at once
    const n = refreshing ? 22 : 70
    for (const palm of palms) {
      for (let i = 0; i < n; i++) {
        this.snow.push(this._makeFlake(false, palm, true))
      }
    }
    this._markUnlocked('a1')
    if (!refreshing) playSparkle()
  }

  triggerSantaHat() {
    this.hatUntil = performance.now() + 4500
    this.antlersUntil = 0 // headwear mutex — hat replaces antlers
    this._markUnlocked('a7')
    playSparkle()
  }

  /**
   * Anchor for the gift bottom so that when fully open, the blessing
   * text sits at the true screen center. Closed gift therefore rests
   * a bit below mid-screen.
   */
  _giftOpenAnchor() {
    const size = Math.min(168, this.w * 0.34)
    const closedH = size * 1.2
    const boxBottom = closedH * 0.18
    const bodyH = closedH * 0.58
    const lidLift = size * (artStyleId === 'paper' ? 1.2 : 0.82)
    // Must match _drawGift gapY when progress === 1
    const gapY = boxBottom - bodyH - lidLift * (artStyleId === 'paper' ? 0.45 : 0.35)
    return {
      x: this.w * 0.5,
      y: this.h * 0.5 - gapY,
    }
  }

  /** True while a gift sequence is still playing (not yet finished). */
  isGiftBusy() {
    return Boolean(this.gift && this.gift.phase !== 'done')
  }

  triggerGiftDrop(giftConfig, payload = {}) {
    // Must finish the current gift fully before another can start
    if (this.isGiftBusy()) return false
    const style = resolveBox(giftConfig.box)
    const blessing = giftConfig.blessing
    const signature = giftConfig.signature || ''
    const center = this._giftOpenAnchor()

    // Case A: tree is up → grow from the mini gift under the tree to center
    if (this.tree) {
      const mini = this._treeMiniGiftWorld()
      const fullSize = Math.min(168, this.w * 0.34)
      const closedH = fullSize * 1.2
      const startScale = clamp(mini.giftH / closedH, 0.12, 0.45)
      this.gift = {
        x: mini.x,
        y: mini.y,
        startX: mini.x,
        startY: mini.y,
        targetX: center.x,
        targetY: center.y,
        vy: 0,
        phase: 'grow',
        grow: 0,
        scale: startScale,
        startScale,
        t: 0,
        style,
        blessing,
        signature,
        openProgress: 0,
        fromTree: true,
        exit: 0,
      }
      this.tree.pairedGift = true
      this.tree.hideMiniGift = true
      this.tree.life = Math.max(this.tree.life, this.tree.age + 60)
      this._markUnlocked('a2')
      return true
    }

    // Case B: no tree → drop from above into screen center
    this.gift = {
      x: center.x,
      y: -70,
      targetX: center.x,
      targetY: center.y,
      vy: 0,
      phase: 'fall',
      t: 0,
      style,
      blessing,
      signature,
      openProgress: 0,
      fromTree: false,
      scale: 1,
      exit: 0,
    }
    this._markUnlocked('a2')
    return true
  }

  /** World position of the mini gift drawn under the active tree. */
  _treeMiniGiftWorld() {
    const tree = this.tree
    const th = Math.min(this.h * 0.58, 320)
    const tw = th * 0.62
    const s = 0.92 + (tree.appear ?? 1) * 0.08
    const tx = tree.x
    const ty = tree.y + th * 0.42
    const giftH = th * 0.17 * s
    return {
      x: tx + tw * 0.08 * s,
      y: ty + th * 0.01 * s,
      giftH,
      giftW: giftH * 0.88,
    }
  }

  triggerBells(payload = {}) {
    const at = payload.at || this.live.pinch
    const strength = clamp(payload.strength ?? 0.7, 0.35, 1)
    const x = nx(at, this.w, this.w * 0.5)
    const y = ny(at, this.h, this.h * 0.4)
    // Signed impulse from shake direction (mirrored canvas: +x is visual left)
    const impulse = Number.isFinite(payload.impulse)
      ? payload.impulse
      : (payload.dir || 1) * (8 + strength * 14)
    if (this.bell) {
      this.bell.x = x
      this.bell.y = y
      this.bell.strength = strength
      this.bell.age = 0
      this.bell.life = 8
      this.bell.held = true
      this.bell.omega = (this.bell.omega || 0) + impulse
    } else {
      this.bell = {
        x,
        y,
        strength,
        age: 0,
        life: 8,
        held: true,
        angle: 0,
        omega: impulse,
        prevX: x,
        notes: [],
      }
    }
    this._markUnlocked('a3')
    const now = performance.now()
    const intervalMs = this._lastBellAt ? now - this._lastBellAt : undefined
    this._lastBellAt = now
    playBell(strength, { intervalMs })
  }

  triggerCandyCane(payload = {}) {
    const at = payload.at || this.live.indexTip
    this.candy = {
      x: nx(at, this.w, this.w * 0.5),
      y: ny(at, this.h, this.h * 0.4),
      rot: 0,
      scale: 0.25,
      life: 2.6,
      age: 0,
      follow: true,
    }
    this._markUnlocked('a4')
    playSparkle()
  }

  triggerHeartBurst(payload = {}) {
    const at = payload.at || this.live.heart
    const cx = nx(at, this.w, this.w * 0.5)
    const cy = ny(at, this.h, this.h * 0.4)
    for (let i = 0; i < 40; i++) {
      const ang = (i / 40) * Math.PI * 2
      this.particles.push({
        kind: i % 3 === 0 ? 'heart' : 'star',
        x: cx,
        y: cy,
        vx: Math.cos(ang) * rand(1.2, 4.2),
        vy: Math.sin(ang) * rand(1.2, 4.2) - 1,
        life: rand(0.7, 1.35),
        age: 0,
        r: rand(2.5, 7),
        color: i % 3 === 0 ? '#e85a5a' : Math.random() > 0.5 ? '#f2e6d0' : '#c9a227',
      })
    }
    this._markUnlocked('a5')
    playSparkle()
  }

  triggerReindeer(_payload = {}) {
    this.antlersUntil = performance.now() + 5000
    this.hatUntil = 0 // headwear mutex — antlers replace hat
    const face = this.live.face
    const cx = face ? face.crownX * this.w : this.w * 0.5
    const cy = face ? face.crownY * this.h : this.h * 0.22
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        kind: 'star',
        x: cx + rand(-40, 40),
        y: cy + rand(-20, 20),
        vx: rand(-1.5, 1.5),
        vy: rand(-2.5, -0.4),
        life: rand(0.5, 1.1),
        age: 0,
        r: rand(2, 5),
        color: '#c9a227',
      })
    }
    this._markUnlocked('a6')
    playWhoosh()
  }

  triggerFireplace(payload = {}) {
    const at = payload.at || this.live.pointDown
    this.fireplace = {
      x: nx(at, this.w, this.w * 0.5),
      y: ny(at, this.h, this.h * 0.85),
      until: performance.now() + 10000,
    }
    this._markUnlocked('b7')
    playWarm()
  }

  triggerTree(payload = {}) {
    const at = payload.at || this.live.indexTip
    const cx = nx(at, this.w, this.w * 0.5)
    const cy = ny(at, this.h, this.h * 0.42)
    this.tree = {
      x: clamp(cx, this.w * 0.22, this.w * 0.78),
      y: clamp(cy, this.h * 0.28, this.h * 0.62),
      lights: 0,
      max: 14,
      age: 0,
      life: 14,
      twinkle: 0,
      flash: 1,
      appear: 0,
      /** 0→1 big star ignition (the main 点灯 beat) */
      starLit: 0,
    }
    this._markUnlocked('b8')
    playTree()
  }

  update(dt) {
    const now = performance.now()
    const boost = now < this.snowBoostUntil
    // Ambient floor only — never cull sticky burst flakes from other gestures
    const sticky = this.snow.filter((f) => f.sticky && now - f.born < 9000)
    const ambient = this.snow.filter((f) => !f.sticky)
    const targetAmbient = boost ? 64 : 48
    while (ambient.length < targetAmbient) ambient.push(this._makeFlake(true))
    if (ambient.length > targetAmbient) ambient.length = targetAmbient
    this.snow = ambient.concat(sticky)

    for (const f of this.snow) {
      f.wobble += dt * 1.5
      f.x += f.vx + Math.sin(f.wobble) * 0.35
      f.y += f.vy * (f.sticky || boost ? 1.55 : 1)
      if (f.y > this.h + 10) {
        if (f.sticky) {
          // sticky burst flakes expire after falling off
          f.born = 0
          f.y = this.h + 20
        } else {
          f.y = -10
          f.x = rand(0, this.w)
        }
      }
    }
    this.snow = this.snow.filter((f) => !f.sticky || now - f.born < 9000)

    // live follow + pivot; release pinch → vanish almost immediately
    if (this.bell && this.live.pinch) {
      const tx = nx(this.live.pinch, this.w, this.bell.x)
      const ty = ny(this.live.pinch, this.h, this.bell.y)
      const prevX = this.bell.prevX ?? tx
      const pivotAx = (tx - prevX) / Math.max(dt, 0.001)
      this.bell.prevX = tx
      this.bell.x += (tx - this.bell.x) * 0.45
      this.bell.y += (ty - this.bell.y) * 0.45
      // Opposite lag: hand accelerates right → bell swings left
      this.bell.omega = (this.bell.omega || 0) - pivotAx * 0.0045
      this.bell.age = 0
      this.bell.held = true
      this.bell.life = 8
    } else if (this.bell && this.bell.held) {
      this.bell.held = false
      this.bell.age = 0
      this.bell.life = 0.12
    }
    if (this.candy?.follow && this.live.indexTip) {
      this.candy.x += (nx(this.live.indexTip, this.w, this.candy.x) - this.candy.x) * 0.4
      this.candy.y += (ny(this.live.indexTip, this.h, this.candy.y) - this.candy.y) * 0.4
    }
    if (this.fireplace && this.live.pointDown) {
      this.fireplace.x += (nx(this.live.pointDown, this.w, this.fireplace.x) - this.fireplace.x) * 0.25
      const ty = Math.min(this.h * 0.92, ny(this.live.pointDown, this.h, this.fireplace.y) + this.h * 0.08)
      this.fireplace.y += (ty - this.fireplace.y) * 0.2
    }
    // Freeze tree while paired with a growing gift
    if (this.tree && this.live.indexTip && !this.tree.pairedGift) {
      const tx = nx(this.live.indexTip, this.w, this.tree.x)
      const ty = ny(this.live.indexTip, this.h, this.tree.y)
      this.tree.x += (clamp(tx, this.w * 0.22, this.w * 0.78) - this.tree.x) * 0.22
      this.tree.y += (clamp(ty, this.h * 0.28, this.h * 0.62) - this.tree.y) * 0.22
    }

    if (this.gift && this.gift.phase !== 'done') {
      const g = this.gift
      const center = this._giftOpenAnchor()
      g.targetX = center.x
      g.targetY = center.y
      g.t += dt
      if (g.phase === 'grow') {
        g.grow = clamp((g.grow || 0) + dt * 1.15, 0, 1)
        const e = g.grow * g.grow * (3 - 2 * g.grow)
        g.scale = g.startScale + (1 - g.startScale) * e
        g.x = g.startX + (g.targetX - g.startX) * e
        g.y = g.startY + (g.targetY - g.startY) * e
        if (g.grow >= 1) {
          g.scale = 1
          g.x = center.x
          g.y = center.y
          g.phase = 'open'
          g.openProgress = 0
          playGiftOpen()
        }
      } else if (g.phase === 'fall') {
        g.x += (g.targetX - g.x) * 0.12
        g.vy += 1500 * dt
        g.y += g.vy * dt
        const floor = center.y
        if (g.y >= floor) {
          g.y = floor
          g.x = center.x
          g.vy = -320
          g.phase = 'bounce'
          playGiftOpen()
        }
      } else if (g.phase === 'bounce') {
        g.x += (g.targetX - g.x) * 0.2
        g.vy += 1500 * dt
        g.y += g.vy * dt
        const floor = center.y
        if (g.y >= floor) {
          g.y = floor
          g.x = center.x
          g.vy = 0
          g.scale = 1
          g.phase = 'open'
          g.openProgress = 0
        }
      } else if (g.phase === 'open') {
        g.x = center.x
        g.y = center.y
        g.scale = 1
        g.openProgress = clamp(g.openProgress + dt * 1.5, 0, 1)
        if (g.openProgress >= 1) g.phase = 'show'
      } else if (g.phase === 'show') {
        g.x = center.x
        g.y = center.y
        g.scale = 1
        if (g.t > 5.8) {
          g.phase = 'exit'
          g.exit = 0
        }
      } else if (g.phase === 'exit') {
        g.x = center.x
        g.y = center.y
        g.exit = clamp((g.exit || 0) + dt * 1.6, 0, 1)
        if (g.fromTree && this.tree?.pairedGift) {
          this.tree.exit = g.exit
        }
        if (g.exit >= 1) {
          if (g.fromTree && this.tree?.pairedGift) this.tree = null
          this.gift = null
        }
      }
    }

    if (this.bell) {
      const b = this.bell
      b.age += dt
      // Pendulum: θ'' = -(g/L) sin(θ) - c θ'
      const gOverL = 18
      const damp = 1.35
      let angle = b.angle || 0
      let omega = b.omega || 0
      const maxAng = (55 * Math.PI) / 180
      omega += (-gOverL * Math.sin(angle) - damp * omega) * dt
      omega = clamp(omega, -22, 22)
      angle += omega * dt
      if (angle > maxAng) {
        angle = maxAng
        omega *= -0.35
      } else if (angle < -maxAng) {
        angle = -maxAng
        omega *= -0.35
      }
      b.angle = angle
      b.omega = omega
      b.swing = (angle * 180) / Math.PI
      if (b.age > 0.05 && b.notes.length < 8 && Math.random() < 0.3) {
        b.notes.push({
          x: b.x + rand(-20, 20),
          y: b.y - 10,
          life: rand(0.6, 1.1),
          age: 0,
        })
      }
      b.notes = b.notes.filter((n) => {
        n.age += dt
        n.y -= 40 * dt
        return n.age < n.life
      })
      if (b.age > b.life) this.bell = null
    }

    if (this.candy) {
      this.candy.age += dt
      this.candy.rot += dt * 2.6
      this.candy.scale = clamp(0.25 + this.candy.age * 1.1, 0.25, 1.1)
      if (this.candy.age > this.candy.life) this.candy = null
    }

    this.particles = this.particles.filter((p) => {
      p.age += dt
      p.x += p.vx
      p.y += p.vy
      p.vy += 28 * dt * 0.02
      return p.age < p.life
    })

    if (this.reindeer) {
      const r = this.reindeer
      r.age += dt
      r.x += r.vx * dt
      r.y += Math.sin(r.age * 4) * 16 * dt
      r.trail.push({ x: r.x, y: r.y, a: 1 })
      if (r.trail.length > 30) r.trail.shift()
      for (const t of r.trail) t.a *= 0.92
      if (r.age > r.life) this.reindeer = null
    }

    if (this.fireplace && now > this.fireplace.until) this.fireplace = null

    if (this.tree) {
      this.tree.age += dt
      this.tree.twinkle += dt
      const exit = this.tree.exit || 0
      if (exit > 0) {
        this.tree.appear = Math.max(0, 1 - exit)
      } else {
        this.tree.appear = Math.min(1, this.tree.appear + dt * 2.4)
      }
      this.tree.flash = Math.max(0, this.tree.flash - dt * 0.9)
      // Big star lights up over ~1.2s, then keeps a warm pulse
      this.tree.starLit = Math.min(1, this.tree.starLit + dt * 0.85)
      if (this.tree.lights < this.tree.max) {
        this.tree.lights = Math.min(this.tree.max, Math.floor(Math.max(0, this.tree.age - 0.35) * 4))
      }
      // Paired with gift: hold until gift exit clears the tree
      if (!this.tree.pairedGift && this.tree.age > this.tree.life) this.tree = null
    }
  }

  draw() {
    const ctx = this.ctx
    const { w, h } = this
    if (!w || !h) return
    ctx.clearRect(0, 0, w, h)
    const now = performance.now()

    if (this.fireplace) this._drawFireplace(ctx, this.fireplace, now)
    if (this.tree) this._drawTree(ctx, this.tree)

    // Pixel: square flakes. Neon/paper/vintage: style-owned snowflake sprites.
    const flakes = this.sprites.snowflakes?.length
      ? this.sprites.snowflakes
      : this.sprites.snowflake
        ? [this.sprites.snowflake]
        : null
    const useSpriteSnow = artStyleId !== 'pixel' && flakes?.length
    if (useSpriteSnow) {
      const t = now * 0.001
      const paperSnow = artStyleId === 'paper'
      const vintageSnow = artStyleId === 'vintage'
      for (const f of this.snow) {
        const img = flakes[Math.abs(Math.floor(f.wobble * 10)) % flakes.length]
        // Neon / paper / vintage: smaller + softer than early oversized draws
        const sizeMul = paperSnow || vintageSnow ? 3.4 : 4.2
        const s = Math.max(paperSnow || vintageSnow ? 5 : 5, Math.round(f.r * sizeMul))
        let alpha = f.a
        if (paperSnow || vintageSnow) alpha *= 0.72
        if (artStyleId === 'neon' && f.flash) {
          // Brief neon blink — only the ≤8% flash cohort
          const pulse = 0.45 + 0.55 * Math.abs(Math.sin(t * 5.5 + f.wobble * 3))
          alpha = Math.min(0.92, f.a * (0.75 + pulse * 0.85))
        }
        if (paperSnow || vintageSnow) {
          f.rot = (f.rot || 0) + (f.spin || 0)
          ctx.save()
          ctx.translate(f.x, f.y)
          ctx.rotate(f.rot)
          ctx.globalAlpha = alpha
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, -s / 2, -s / 2, s, s)
          ctx.restore()
        } else {
          drawSprite(ctx, img, f.x, f.y, s, s, {
            anchorX: 0.5,
            anchorY: 0.5,
            alpha,
          })
        }
      }
    } else {
      for (const f of this.snow) {
        const s = Math.max(2, Math.round(f.r * 1.6))
        ctx.fillStyle = `rgba(255,255,255,${f.a})`
        ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s)
      }
    }

    if (this.gift && this.gift.phase !== 'done') this._drawGift(ctx)
    if (this.bell) this._drawBellProp(ctx, this.bell)
    if (this.candy) this._drawCandy(ctx, this.candy)

    for (const p of this.particles) {
      const alpha = 1 - p.age / p.life
      ctx.globalAlpha = alpha
      if (p.kind === 'heart') this._drawHeartShape(ctx, p.x, p.y, p.r, p.color)
      else {
        ctx.fillStyle = p.color
        this._drawPixelStar(ctx, p.x, p.y, p.r)
      }
      ctx.globalAlpha = 1
    }

    if (this.reindeer) this._drawReindeer(ctx, this.reindeer)

    // decorative hat + antlers follow face
    this._drawFaceDecor(ctx)
  }

  _drawFaceDecor(ctx) {
    const face = this.live.face
    if (!face) return
    const now = performance.now()
    const showHat = now < this.hatUntil
    const showAntlers = now < this.antlersUntil
    if (!showHat && !showAntlers) return

    const span = face.earSpan * this.w
    // Match pixel Christmas headwear: crown anchor only (not face/nose), compact scale.
    const crownX = (face.crownX ?? face.x) * this.w
    const crownY = (face.crownY ?? face.y - face.earSpan * 1.05) * this.h
    // Same scale/position for all art styles (pixel kept-build sizing)
    const hatW = clamp(span * 1.95, 78, 168)
    const hatH = hatW * 0.82
    const antW = clamp(span * 2.2, 88, 180)
    const antH = antW * 0.5
    if (showAntlers && this.sprites.antlers) {
      drawSprite(ctx, this.sprites.antlers, crownX, crownY - span * 0.2, antW, antH, {
        anchorX: 0.5,
        anchorY: 1,
        alpha: 0.96,
      })
    }
    if (showHat && this.sprites.hat) {
      // Brim sits on crown; slight X bias because the tip flops right in the sprite
      drawSprite(ctx, this.sprites.hat, crownX - hatW * 0.04, crownY, hatW, hatH, {
        anchorX: 0.48,
        anchorY: 0.96,
        alpha: 0.98,
      })
    }
  }

  _drawPixelStar(ctx, x, y, r) {
    const s = Math.max(3, Math.round(r))
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - s, 2, s * 2)
    ctx.fillRect(Math.round(x) - s, Math.round(y) - 1, s * 2, 2)
  }

  _drawFireplace(ctx, fp, now) {
    const remain = Math.max(0, (fp.until - now) / 10000)
    const x = fp.x
    const y = Math.min(this.h - 10, Math.max(this.h * 0.55, fp.y))
    const fw = Math.min(240, this.w * 0.4)

    const warm = ctx.createLinearGradient(0, y - 120, 0, this.h)
    warm.addColorStop(0, 'rgba(255,120,40,0)')
    warm.addColorStop(1, `rgba(255,110,30,${0.16 * remain})`)
    ctx.fillStyle = warm
    ctx.fillRect(0, 0, this.w, this.h)

    // stone hearth
    ctx.fillStyle = 'rgba(48, 32, 24, 0.92)'
    roundRectPath(ctx, x - fw / 2, y - 58, fw, 70, 8)
    ctx.fill()
    ctx.strokeStyle = 'rgba(201,162,39,0.35)'
    ctx.lineWidth = 2
    ctx.stroke()

    for (let i = 0; i < 8; i++) {
      const fx = x - fw * 0.32 + (i / 7) * fw * 0.64
      const fh = 34 + Math.sin(now / 90 + i) * 14 + Math.random() * 8
      const grad = ctx.createRadialGradient(fx, y - 40, 2, fx, y - 40, fh)
      grad.addColorStop(0, 'rgba(255,240,160,0.95)')
      grad.addColorStop(0.45, 'rgba(255,130,40,0.7)')
      grad.addColorStop(1, 'rgba(180,40,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(fx - 12, y - 12)
      ctx.quadraticCurveTo(fx, y - 12 - fh, fx + 12, y - 12)
      ctx.fill()
    }
  }

  _drawTree(ctx, tree) {
    const appear = tree.appear ?? 1
    const th = Math.min(this.h * 0.58, 320)
    const tw = th * 0.62
    const tx = tree.x
    const ty = tree.y + th * 0.42
    const lit = tree.lights / Math.max(1, tree.max)
    const starLit = tree.starLit ?? 0
    const pulse = 0.55 + 0.45 * Math.sin(tree.twinkle * 4.2)
    const ease = starLit * starLit * (3 - 2 * starLit)

    ctx.save()
    ctx.globalAlpha = appear
    ctx.translate(tx, ty)
    ctx.scale(0.92 + appear * 0.08, 0.92 + appear * 0.08)

    // Ground wash under the tree
    if (ease > 0.12) {
      const g = ctx.createRadialGradient(0, th * 0.06, 6, 0, th * 0.06, tw * 0.8)
      g.addColorStop(0, `rgba(255, 220, 110, ${0.26 * ease * pulse})`)
      g.addColorStop(0.55, `rgba(80, 150, 90, ${0.1 * ease})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(0, th * 0.1, tw * 0.55, th * 0.08, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Tree sprite (keeps its own painted star — we only add light)
    if (this.sprites.tree) {
      ctx.imageSmoothingEnabled = false
      drawSprite(ctx, this.sprites.tree, 0, 0, tw, th, {
        anchorX: 0.5,
        anchorY: 1,
      })
    } else {
      this._paintFallbackTree(ctx, 0, 0, tw, th, lit)
    }

    // Mini gift at the foot of the tree (hidden once it grows into the big gift)
    const giftImg = this.sprites.gift
    const giftH = th * 0.17
    const giftW = giftH * 0.88
    if (giftImg && !tree.hideMiniGift) {
      ctx.imageSmoothingEnabled = false
      ctx.globalAlpha = appear * (0.8 + ease * 0.2)
      drawSprite(ctx, giftImg, tw * 0.08, th * 0.01, giftW, giftH, {
        anchorX: 0.5,
        anchorY: 1,
      })
      ctx.globalAlpha = appear
    }

    // Branch fairy lights bloom on
    if (ease > 0.2) {
      const colors = [
        [255, 92, 92],
        [255, 214, 90],
        [120, 200, 255],
        [255, 160, 70],
      ]
      for (let i = 0; i < tree.lights; i++) {
        const row = Math.floor(i / 4)
        const col = i % 4
        const rows = Math.ceil(tree.max / 4)
        const rowT = (row + 0.55) / rows
        const halfW = tw * (0.14 + rowT * 0.3)
        const lx = -halfW + (col / 3) * halfW * 2 + Math.sin(i * 1.7) * 3
        const ly = -th * 0.82 + rowT * th * 0.62
        const twinkle = 0.45 + 0.55 * Math.sin(tree.twinkle * 5.2 + i)
        const [cr, cg, cb] = colors[i % colors.length]
        ctx.save()
        ctx.globalAlpha = appear * ease * (0.55 + twinkle * 0.45)
        ctx.shadowColor = `rgba(${cr},${cg},${cb},0.95)`
        ctx.shadowBlur = 10 + twinkle * 10
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`
        ctx.beginPath()
        ctx.arc(lx, ly, 2.8 + twinkle, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Glow-only on the tree-top star (no extra drawn star)
    const tipY = -th * 0.96
    const halo = 0.15 + ease * 0.85 * pulse + tree.flash * 0.3
    ctx.save()
    const haloGrad = ctx.createRadialGradient(0, tipY, 4, 0, tipY, tw * 0.55)
    haloGrad.addColorStop(0, `rgba(255, 245, 180, ${0.7 * halo})`)
    haloGrad.addColorStop(0.3, `rgba(255, 200, 80, ${0.35 * halo})`)
    haloGrad.addColorStop(1, 'rgba(255, 170, 40, 0)')
    ctx.fillStyle = haloGrad
    ctx.beginPath()
    ctx.arc(0, tipY, tw * 0.55, 0, Math.PI * 2)
    ctx.fill()

    // Soft rays from the existing tip star
    if (ease > 0.25) {
      ctx.translate(0, tipY)
      ctx.globalAlpha = appear * ease * (0.4 + pulse * 0.3)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + tree.twinkle * 0.35
        ctx.rotate(a)
        const ray = ctx.createLinearGradient(0, 0, 0, -tw * 0.38)
        ray.addColorStop(0, 'rgba(255, 235, 150, 0.7)')
        ray.addColorStop(1, 'rgba(255, 200, 80, 0)')
        ctx.fillStyle = ray
        ctx.beginPath()
        ctx.moveTo(-1.8, 0)
        ctx.lineTo(0, -tw * 0.38)
        ctx.lineTo(1.8, 0)
        ctx.closePath()
        ctx.fill()
        ctx.rotate(-a)
      }
    }
    ctx.restore()

    ctx.restore()
  }

  _paintFallbackTree(ctx, x, y, tw, th, lit) {
    ctx.save()
    ctx.translate(x, y)
    // trunk
    ctx.fillStyle = '#6b4226'
    ctx.fillRect(-tw * 0.06, -th * 0.12, tw * 0.12, th * 0.14)
    const layers = [
      { top: -0.92, bot: -0.62, hw: 0.22 },
      { top: -0.7, bot: -0.38, hw: 0.32 },
      { top: -0.46, bot: -0.1, hw: 0.42 },
    ]
    for (const L of layers) {
      ctx.beginPath()
      ctx.moveTo(0, th * L.top)
      ctx.lineTo(tw * L.hw, th * L.bot)
      ctx.lineTo(-tw * L.hw, th * L.bot)
      ctx.closePath()
      const grd = ctx.createLinearGradient(0, th * L.top, 0, th * L.bot)
      grd.addColorStop(0, `rgba(70, 150, 90, ${0.7 + lit * 0.3})`)
      grd.addColorStop(1, `rgba(22, 70, 40, ${0.85})`)
      ctx.fillStyle = grd
      ctx.fill()
    }
    ctx.restore()
  }

  _drawGift(ctx) {
    const g = this.gift
    if (!g || g.phase === 'done') return
    const size = Math.min(168, this.w * 0.34)
    const progress =
      g.phase === 'open' || g.phase === 'show' || g.phase === 'exit'
        ? g.phase === 'open'
          ? g.openProgress
          : 1
        : 0
    const scale = g.scale ?? 1
    const fade = g.phase === 'exit' ? Math.max(0, 1 - (g.exit || 0)) : 1
    ctx.save()
    ctx.globalAlpha = fade
    ctx.translate(g.x, g.y)
    ctx.scale(scale, scale)
    ctx.imageSmoothingEnabled = artStyleId !== 'pixel'

    // Dual-path open: SEPARATE box + lid sprites. Lid physically lifts off.
    // Paper: always body+lid (even when closed) so orientation never jumps
    // from a different closed sprite to mismatched open pieces.
    const closed = this.sprites.gift
    const body = this.sprites.giftBox
    const lid = this.sprites.giftLid
    const paper = artStyleId === 'paper'
    const closedH = size * 1.2
    const boxBottom = closedH * 0.18

    const bodyAspect =
      body && body.naturalWidth ? body.naturalHeight / body.naturalWidth : 0.58
    const lidAspect =
      lid && lid.naturalWidth ? lid.naturalHeight / lid.naturalWidth : 0.52
    const bodyW = size * (paper ? 0.92 : 0.86)
    const bodyH = paper
      ? bodyW * Math.max(0.38, Math.min(0.72, bodyAspect))
      : closedH * 0.58
    const lidW = size * (paper ? 1.02 : 1.06)
    const lidH = paper
      ? lidW * Math.max(0.4, Math.min(0.75, lidAspect))
      : closedH * 0.52

    // Strong vertical lift so the gap reads as a real lid leaving the box
    const lidLift = progress * size * (paper ? 1.2 : 0.82)
    const lidRot = -progress * (paper ? 0.28 : 0.42)
    const lidSlideX = paper ? progress * size * 0.06 : 0

    // Paper always dual-sprite; other styles keep closed sprite until open starts
    const useClosedSprite = !paper && progress < 0.02 && closed
    if (useClosedSprite) {
      drawSprite(ctx, closed, 0, boxBottom, size, closedH, {
        anchorX: 0.5,
        anchorY: 1,
      })
    } else {
      if (body) {
        drawSprite(ctx, body, 0, boxBottom, bodyW, bodyH, {
          anchorX: 0.5,
          anchorY: 1,
        })
      } else {
        this._paintFrontGiftBody(ctx, 0, boxBottom - bodyH, bodyW, bodyH, g.style, true)
      }

      // Blessing between lid and box — no fill / tissue inside
      // Text is un-mirrored below (scale -1) so selfie mirror stays readable.
      if (progress > 0.18) {
        const alpha = Math.min(1, (progress - 0.18) / 0.35) * (ctx.globalAlpha || 1)
        ctx.globalAlpha = alpha
        const bw = Math.min(280, this.w * 0.65)
        const bh = g.signature ? 78 : 56
        const gapY = boxBottom - bodyH - lidLift * (paper ? 0.45 : 0.35)
        const card = blessingCardStyle(artStyleId)
        ctx.fillStyle = card.fill
        ctx.fillRect(-bw / 2, gapY - bh / 2, bw, bh)
        ctx.strokeStyle = card.stroke
        ctx.lineWidth = card.lineWidth
        ctx.strokeRect(-bw / 2, gapY - bh / 2, bw, bh)
        ctx.save()
        ctx.scale(-1, 1)
        ctx.fillStyle = card.text
        ctx.font = card.font
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        wrapText(ctx, g.blessing, 0, gapY - (g.signature ? 10 : 0), bw - 24, 24)
        if (g.signature) {
          ctx.fillStyle = card.sig
          ctx.font = card.sigFont
          ctx.fillText(`— ${g.signature}`, 0, gapY + 22)
        }
        ctx.restore()
        ctx.globalAlpha = fade
      }

      // Lid rests on body top; lifts straight up as progress rises
      const lidRestY = boxBottom - bodyH + (paper ? bodyH * 0.02 : bodyH * 0.12)
      ctx.save()
      ctx.translate(lidSlideX, lidRestY - lidLift)
      ctx.rotate(lidRot)
      if (lid) {
        drawSprite(ctx, lid, 0, 0, lidW, lidH, {
          anchorX: 0.5,
          anchorY: paper ? 1 : 0.92,
        })
      } else {
        this._paintFrontGiftLid(ctx, 0, 0, lidW, lidH * 0.55, g.style)
      }
      ctx.restore()
    }

    ctx.restore()
  }

  /** Front-facing closed/open body — matches closed look. */
  _paintFrontGiftBody(ctx, cx, top, w, h, style, open) {
    const x = Math.round(cx - w / 2)
    const y = Math.round(top)
    const box = style.box || '#9b1b1b'
    const ribbon = style.ribbon || '#c9a227'
    const s = Math.max(3, Math.round(w / 18))
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = box
    ctx.fillRect(x, y, w, h)
    // side shade (not white)
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillRect(x + w * 0.78, y, w * 0.22, h)
    if (open) {
      // plain dark interior — no patterned 底纹
      ctx.fillStyle = '#2a0808'
      ctx.fillRect(x + s, y + s, w - s * 2, Math.max(s * 2, h * 0.22))
    }
    ctx.fillStyle = ribbon
    ctx.fillRect(cx - s, y, s * 2, h)
    ctx.fillRect(x, y + h * 0.42, w, s * 2)
    ctx.strokeStyle = 'rgba(20,8,8,0.9)'
    ctx.lineWidth = 3
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3)
    ctx.restore()
  }

  _paintFrontGiftLid(ctx, cx, cy, w, h, style) {
    const x = Math.round(cx - w / 2)
    const y = Math.round(cy - h)
    const box = style.box || '#9b1b1b'
    const ribbon = style.ribbon || '#c9a227'
    const s = Math.max(3, Math.round(w / 18))
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = box
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = ribbon
    ctx.fillRect(cx - s, y, s * 2, h)
    ctx.fillRect(x, y + h * 0.45, w, s)
    ctx.strokeStyle = 'rgba(20,8,8,0.9)'
    ctx.lineWidth = 3
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3)
    // bow
    const by = y - 2
    ctx.fillStyle = ribbon
    ctx.fillRect(cx - 3 * s, by - 2 * s, 2 * s, 2 * s)
    ctx.fillRect(cx + s, by - 2 * s, 2 * s, 2 * s)
    ctx.fillRect(cx - s, by - s, 2 * s, 2 * s)
    ctx.fillRect(cx - 2 * s, by + s, s, 2 * s)
    ctx.fillRect(cx + s, by + s, s, 2 * s)
    ctx.restore()
  }

  /** Mini gifts only — no background 底纹 at all. */
  _paintGiftFill(ctx, cx, top, w, h) {
    const s = Math.max(3, Math.round(w / 14))
    const y0 = Math.round(top)
    ctx.save()
    ctx.imageSmoothingEnabled = false
    const minis = [
      { x: -0.28, y: 0.2, c: '#9b1b1b', rb: '#c9a227', sc: 3 },
      { x: -0.06, y: 0.14, c: '#1f5c3a', rb: '#c9a227', sc: 4 },
      { x: 0.18, y: 0.18, c: '#1a2744', rb: '#c5cdd8', sc: 3 },
      { x: 0.3, y: 0.38, c: '#9b1b1b', rb: '#c9a227', sc: 2 },
      { x: -0.3, y: 0.42, c: '#1f5c3a', rb: '#c9a227', sc: 3 },
      { x: 0.02, y: 0.4, c: '#b03a3a', rb: '#c9a227', sc: 4 },
      { x: 0.2, y: 0.54, c: '#1a2744', rb: '#c5cdd8', sc: 3 },
      { x: -0.14, y: 0.56, c: '#9b1b1b', rb: '#c9a227', sc: 3 },
      { x: 0.08, y: 0.6, c: '#2f7a4a', rb: '#c9a227', sc: 2 },
      { x: -0.02, y: 0.3, c: '#8b1e1e', rb: '#c9a227', sc: 3 },
    ]
    for (const m of minis) {
      const mw = s * m.sc
      const mh = s * m.sc
      const mx = Math.round(cx + m.x * w - mw / 2)
      const my = Math.round(y0 + m.y * h)
      ctx.fillStyle = m.c
      ctx.fillRect(mx, my, mw, mh)
      ctx.fillStyle = m.rb
      const rw = Math.max(1, Math.floor(s * 0.7))
      ctx.fillRect(mx + Math.floor(mw / 2 - rw / 2), my, rw, mh)
      ctx.fillRect(mx, my + Math.floor(mh / 2 - rw / 2), mw, rw)
    }
    ctx.restore()
  }

  /** Chunkiest fallback pixel box (integer blocks). */
  _paintPixelGiftBox(ctx, cx, top, w, h, style, open) {
    const s = Math.max(4, Math.round(w / 16))
    const cols = Math.round(w / s)
    const rows = Math.round(h / s)
    const x0 = Math.round(cx - (cols * s) / 2)
    const y0 = Math.round(top)
    const ribbon = style.ribbon || '#c9a227'
    const box = style.box || '#9b1b1b'
    const dark = '#5a1010'
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const midV = c === Math.floor(cols / 2) || c === Math.floor(cols / 2) - 1
        const midH = r === Math.floor(rows * 0.45) || r === Math.floor(rows * 0.45) + 1
        let col = box
        if (open && r < 2) col = dark
        if (midV || midH) col = ribbon
        if (c === cols - 1) col = dark
        ctx.fillStyle = col
        ctx.fillRect(x0 + c * s, y0 + r * s, s, s)
      }
    }
  }

  _paintPixelGiftLid(ctx, cx, cy, w, h, style) {
    const s = Math.max(4, Math.round(w / 16))
    const cols = Math.round(w / s)
    const rows = Math.max(3, Math.round(h / s))
    const x0 = Math.round(cx - (cols * s) / 2)
    const y0 = Math.round(cy - rows * s)
    const ribbon = style.ribbon || '#c9a227'
    const box = style.box || '#9b1b1b'
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const midV = c === Math.floor(cols / 2) || c === Math.floor(cols / 2) - 1
        ctx.fillStyle = midV || r === rows - 2 ? ribbon : box
        ctx.fillRect(x0 + c * s, y0 + r * s, s, s)
      }
    }
    // pixel bow
    const bx = Math.round(cx)
    const by = y0 - s
    ctx.fillStyle = ribbon
    ctx.fillRect(bx - 3 * s, by - 2 * s, 2 * s, 2 * s)
    ctx.fillRect(bx + s, by - 2 * s, 2 * s, 2 * s)
    ctx.fillRect(bx - s, by - s, 2 * s, 2 * s)
    ctx.fillRect(bx - 2 * s, by + s, s, 2 * s)
    ctx.fillRect(bx + s, by + s, s, 2 * s)
  }

  _drawBellProp(ctx, b) {
    const size = Math.min(100, this.w * 0.18)
    const ang = Number.isFinite(b.angle) ? b.angle : ((b.swing || 0) * Math.PI) / 180
    const fade = b.life <= 0.2 ? Math.max(0, 1 - b.age / Math.max(0.01, b.life)) : 1
    ctx.save()
    ctx.globalAlpha = fade
    ctx.translate(b.x, b.y)
    ctx.rotate(ang)
    ctx.imageSmoothingEnabled = false
    if (this.sprites.bell) {
      // Anchor at the bell loop / “头” so it sits between pinched fingers
      drawSprite(ctx, this.sprites.bell, 0, 0, size, size * 1.25, {
        anchorX: 0.5,
        anchorY: 0.06,
      })
    } else {
      ctx.fillStyle = '#c9a227'
      ctx.fillRect(-18, 0, 36, 44)
    }
    ctx.restore()

    for (const n of b.notes) {
      const a = (1 - n.age / n.life) * fade
      ctx.save()
      ctx.translate(n.x, n.y)
      ctx.scale(-1, 1)
      ctx.fillStyle = `rgba(201,162,39,${a})`
      ctx.font = '22px "ZCOOL KuaiLe", sans-serif'
      ctx.fillText('♪', 0, 0)
      ctx.restore()
    }
  }

  _drawCandy(ctx, c) {
    const alpha = c.age > c.life - 0.4 ? (c.life - c.age) / 0.4 : 1
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate(c.rot)
    ctx.scale(c.scale, c.scale)
    ctx.globalAlpha = alpha
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#f7f0e4'
    ctx.lineWidth = 16
    ctx.beginPath()
    ctx.moveTo(0, 52)
    ctx.lineTo(0, -8)
    ctx.quadraticCurveTo(0, -42, 30, -42)
    ctx.stroke()
    ctx.strokeStyle = '#c43a3a'
    ctx.lineWidth = 16
    ctx.setLineDash([11, 11])
    ctx.beginPath()
    ctx.moveTo(0, 52)
    ctx.lineTo(0, -8)
    ctx.quadraticCurveTo(0, -42, 30, -42)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  _drawReindeer(ctx, r) {
    for (const t of r.trail) {
      ctx.beginPath()
      ctx.fillStyle = `rgba(201,162,39,${t.a * 0.4})`
      ctx.arc(t.x - 18, t.y + 6, 7 * t.a, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.save()
    ctx.translate(r.x, r.y)
    ctx.fillStyle = 'rgba(36, 26, 18, 0.95)'
    ctx.beginPath()
    ctx.ellipse(0, 0, 30, 13, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(30, -8, 13, 10, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(120, 80, 40, 0.95)'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(28, -16)
    ctx.lineTo(22, -34)
    ctx.lineTo(14, -38)
    ctx.moveTo(24, -30)
    ctx.lineTo(30, -38)
    ctx.moveTo(36, -16)
    ctx.lineTo(42, -34)
    ctx.lineTo(50, -36)
    ctx.stroke()
    ctx.fillStyle = '#e85a5a'
    ctx.shadowColor = '#ff6666'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(40, -6, 3.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  _drawHeartShape(ctx, x, y, r, color) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(r / 10, r / 10)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, 6)
    ctx.bezierCurveTo(-12, -4, -8, -14, 0, -8)
    ctx.bezierCurveTo(8, -14, 12, -4, 0, 6)
    ctx.fill()
    ctx.restore()
  }

  _drawStar(ctx, x, y, r) {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
      const b = a + Math.PI / 5
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
      ctx.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45)
    }
    ctx.closePath()
    ctx.fill()
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = [...text]
  let line = ''
  const lines = []
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else line = test
  }
  if (line) lines.push(line)
  const startY = y - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineHeight))
}

function blessingCardStyle(styleId) {
  if (styleId === 'vintage') {
    return {
      fill: 'rgba(243, 234, 214, 0.96)',
      stroke: '#8c3636',
      lineWidth: 2,
      text: '#2f241c',
      sig: 'rgba(140,54,54,0.9)',
      font: '600 20px "Noto Serif SC", "Cormorant Garamond", serif',
      sigFont: '500 15px "Noto Serif SC", "Cormorant Garamond", serif',
    }
  }
  if (styleId === 'paper') {
    return {
      fill: 'rgba(245, 239, 228, 0.97)',
      stroke: '#2e4d36',
      lineWidth: 2,
      text: '#2a3028',
      sig: 'rgba(178,45,45,0.92)',
      font: '600 20px "ZCOOL XiaoWei", "Noto Sans SC", sans-serif',
      sigFont: '500 15px "Noto Sans SC", "Nunito", sans-serif',
    }
  }
  if (styleId === 'neon') {
    return {
      fill: 'rgba(5, 12, 28, 0.92)',
      stroke: '#00f0ff',
      lineWidth: 2,
      text: '#e8f7ff',
      sig: 'rgba(184,255,60,0.95)',
      font: '600 20px "Noto Sans SC", "Orbitron", sans-serif',
      sigFont: '500 15px "Noto Sans SC", "Orbitron", sans-serif',
    }
  }
  return {
    fill: 'rgba(12, 26, 18, 0.94)',
    stroke: '#c9a227',
    lineWidth: 3,
    text: '#f2e6d0',
    sig: 'rgba(201,162,39,0.95)',
    font: '20px "ZCOOL KuaiLe", sans-serif',
    sigFont: '15px "ZCOOL KuaiLe", sans-serif',
  }
}

/** MediaPipe Hands gestures — coach/dock cards; guides follow active art pack. */
export let EFFECT_META = []

function rebuildEffectMeta() {
  EFFECT_META = [
    {
      id: 'a1',
      name: '飘雪祝福',
      hint: '五指张开，雪从掌心洒出',
      guide: ART.guideSnow,
    },
    {
      id: 'a3',
      name: '圣诞铃响',
      hint: '必须露出拇、食两个手指并捏合，其余手指收起，再左右轻摇才能触发',
      guide: ART.guideBell,
    },
    {
      id: 'a7',
      name: '圣诞帽',
      hint: '伸出 1 根手指（食指），头上出现圣诞帽',
      guide: ART.guideHat,
    },
    {
      id: 'a6',
      name: '驯鹿鹿角',
      hint: '伸出 2 根手指（食指+中指），头上出现鹿角',
      guide: ART.guideAntlers,
    },
    {
      id: 'b8',
      name: '圣诞树点灯',
      hint: '伸出 3 根手指（食指+中指+无名指），树顶发光点灯',
      guide: ART.guideTree,
    },
    {
      id: 'a2',
      name: '礼物掉落',
      hint: '双手比心：无树时礼物落到中间偏下再打开；有树时从小礼物长大到同一位置',
      guide: ART.guideGift,
    },
  ]
}

rebuildEffectMeta()
