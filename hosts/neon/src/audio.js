/** Festive sounds via Web Audio (no external files). */

let ctx = null
let muted = true
/** Cursor into carol melody — one note per bell trigger. */
let carolIndex = 0
/** Last trigger time — drives note duration from shake speed. */
let lastBellAt = 0

export function isMuted() {
  return muted
}

export function setMuted(value) {
  muted = Boolean(value)
  try {
    localStorage.setItem('snow-night-muted', muted ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function loadMutePreference() {
  try {
    const v = localStorage.getItem('snow-night-muted')
    muted = v !== '0'
  } catch {
    muted = true
  }
  return muted
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, dur, type = 'sine', gain = 0.08, slideTo = null) {
  const c = ensureCtx()
  if (!c || muted) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, c.currentTime + start)
  if (slideTo != null) {
    o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur)
  }
  g.gain.setValueAtTime(0.0001, c.currentTime + start)
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start(c.currentTime + start)
  o.stop(c.currentTime + start + dur + 0.03)
}

function playNote(freq, start, dur, gain) {
  const c = ensureCtx()
  if (!c || muted) return
  const t0 = c.currentTime + start
  const o = c.createOscillator()
  const o2 = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o2.type = 'triangle'
  o.frequency.value = freq
  o2.frequency.value = freq * 2.003
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(gain * 0.35, t0 + dur * 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g)
  o2.connect(g)
  g.connect(c.destination)
  o.start(t0)
  o2.start(t0)
  o.stop(t0 + dur + 0.04)
  o2.stop(t0 + dur + 0.04)
}

/**
 * 铃儿响叮当 — each trigger plays exactly one note.
 * Note length follows shake interval (fast shake → short notes).
 */
const JINGLE_BELLS = [
  { f: 659.25, d: 0.28 },
  { f: 659.25, d: 0.28 },
  { f: 659.25, d: 0.5 },
  { f: 659.25, d: 0.28 },
  { f: 659.25, d: 0.28 },
  { f: 659.25, d: 0.5 },
  { f: 659.25, d: 0.28 },
  { f: 783.99, d: 0.28 },
  { f: 523.25, d: 0.28 },
  { f: 587.33, d: 0.28 },
  { f: 659.25, d: 0.7 },
  { f: 698.46, d: 0.28 },
  { f: 698.46, d: 0.28 },
  { f: 698.46, d: 0.28 },
  { f: 698.46, d: 0.28 },
  { f: 698.46, d: 0.28 },
  { f: 659.25, d: 0.28 },
  { f: 659.25, d: 0.28 },
  { f: 659.25, d: 0.22 },
  { f: 659.25, d: 0.22 },
  { f: 659.25, d: 0.28 },
  { f: 587.33, d: 0.28 },
  { f: 587.33, d: 0.28 },
  { f: 659.25, d: 0.28 },
  { f: 587.33, d: 0.5 },
  { f: 783.99, d: 0.65 },
]

/**
 * @param {number} strength
 * @param {{ intervalMs?: number }} [opts] — ms since previous trigger; faster = shorter note
 */
export function playBell(strength = 0.7, opts = {}) {
  const c = ensureCtx()
  if (!c || muted) return
  const now = performance.now()
  const gap =
    Number.isFinite(opts.intervalMs) && opts.intervalMs > 0
      ? opts.intervalMs
      : lastBellAt
        ? now - lastBellAt
        : 380
  lastBellAt = now

  // Map shake interval → duration scale (fast ~80ms → 0.4×, slow ~700ms → 1.5×)
  const tempo = Math.max(0.35, Math.min(1.65, gap / 320))
  const note = JINGLE_BELLS[carolIndex % JINGLE_BELLS.length]
  carolIndex = (carolIndex + 1) % JINGLE_BELLS.length
  const dur = Math.max(0.09, Math.min(0.75, note.d * tempo))
  const gain = 0.055 + strength * 0.04
  // Exactly one pitch per shake (no octave double)
  playNote(note.f, 0, dur, gain)
}

export function keepCarolAlive() {
  /* no-op: melody is one-note-per-trigger */
}

export function stopCarol() {
  /* no-op */
}

export function resetCarol() {
  carolIndex = 0
  lastBellAt = 0
}

export function playGiftOpen() {
  tone(196, 0, 0.12, 'triangle', 0.06)
  tone(392, 0.1, 0.18, 'sine', 0.05)
  tone(587, 0.22, 0.35, 'sine', 0.055)
  tone(880, 0.28, 0.25, 'triangle', 0.03)
}

export function playSparkle() {
  tone(987, 0, 0.15, 'sine', 0.035)
  tone(1318, 0.06, 0.18, 'sine', 0.028)
  tone(1760, 0.12, 0.2, 'triangle', 0.02)
}

export function playWhoosh() {
  const c = ensureCtx()
  if (!c || muted) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(320, c.currentTime)
  o.frequency.exponentialRampToValueAtTime(90, c.currentTime + 0.55)
  g.gain.setValueAtTime(0.045, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.55)
  o.connect(g)
  g.connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.6)
}

export function playWarm() {
  tone(110, 0, 0.8, 'sine', 0.05)
  tone(164, 0.05, 0.85, 'sine', 0.03)
  tone(220, 0.15, 0.6, 'triangle', 0.02)
}

export function playTree() {
  tone(440, 0, 0.12, 'sine', 0.04)
  tone(554, 0.1, 0.12, 'sine', 0.04)
  tone(659, 0.2, 0.14, 'sine', 0.045)
  tone(880, 0.32, 0.35, 'triangle', 0.035)
}
