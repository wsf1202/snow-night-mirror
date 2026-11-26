import { EFFECT_META } from './effects.js'

/**
 * Guided practice — one gesture image at a time (final pose only).
 * Success does NOT auto-advance; OK 👌 (or button) goes next — text only, no OK step art.
 */
export class GestureCoach {
  constructor({ root, giftHint, onStep, onComplete, onReadyNext }) {
    this.root = root
    this.giftHint = giftHint
    this.onStep = onStep
    this.onComplete = onComplete
    this.onReadyNext = onReadyNext
    this.index = 0
    this.active = true
    this.done = false
    this.stepCleared = false
    this._mount()
  }

  get current() {
    return EFFECT_META[this.index] || null
  }

  _mount() {
    this.root.innerHTML = `
      <div class="coach-panel pixel-panel" id="coachPanel">
        <div class="coach-progress"><span id="coachProgress"></span></div>
        <div class="coach-visual" id="coachVisual"></div>
        <div class="coach-copy">
          <strong id="coachTitle"></strong>
          <p id="coachHint"></p>
          <p class="coach-status" id="coachStatus">做对后比 OK 进入下一步</p>
        </div>
        <div class="coach-next-hint" id="coachNextHint" hidden>
          <span>比 OK → 下一步</span>
        </div>
        <div class="coach-actions">
          <button type="button" class="btn btn-ghost coach-prev" id="coachPrev">← 上一步</button>
          <button type="button" class="btn btn-ghost coach-skip" id="coachSkip">跳过该动作 →</button>
        </div>
      </div>
    `
    this.panel = this.root.querySelector('#coachPanel')
    this.progressEl = this.root.querySelector('#coachProgress')
    this.visualEl = this.root.querySelector('#coachVisual')
    this.titleEl = this.root.querySelector('#coachTitle')
    this.hintEl = this.root.querySelector('#coachHint')
    this.statusEl = this.root.querySelector('#coachStatus')
    this.nextHint = this.root.querySelector('#coachNextHint')
    this.prevBtn = this.root.querySelector('#coachPrev')
    this.root.querySelector('#coachSkip').addEventListener('click', () => this.skip())
    this.prevBtn.addEventListener('click', () => this.prev())
    this.render()
  }

  render() {
    if (!this.active || this.done) {
      this.panel.hidden = true
      this.onReadyNext?.(false)
      return
    }
    this.panel.hidden = false
    this.stepCleared = false
    this.onReadyNext?.(false)
    const m = this.current
    this.progressEl.textContent = `手势练习 ${this.index + 1} / ${EFFECT_META.length}`
    this.titleEl.textContent = m.name
    this.hintEl.textContent = m.id === 'a2' ? this.giftHint || m.hint : m.hint
    this.statusEl.textContent = '可多次练习 · 比 OK 再进入下一步'
    this.statusEl.classList.remove('ok')
    this.nextHint.hidden = true
    this.prevBtn.disabled = this.index === 0
    this.visualEl.innerHTML = `
      <img class="coach-guide-img pixelated" src="${m.guide}" alt="${m.name} 手势示意" />
      <div class="coach-guide-badge">${m.name}</div>
    `
    this.onStep?.(m)
  }

  /** Practice gesture succeeded — can keep re-triggering until OK. */
  notify(effectId) {
    if (!this.active || this.done) return false
    const m = this.current
    if (!m || m.id !== effectId) return false
    this.stepCleared = true
    this.statusEl.textContent = '✓ 已触发（可再做）· 比 OK 进入下一步'
    this.statusEl.classList.add('ok')
    this.nextHint.hidden = false
    this.onReadyNext?.(true)
    return true
  }

  /** OK while step cleared → advance. */
  tryAdvanceByGesture() {
    if (!this.active || this.done || !this.stepCleared) return false
    this.advance()
    return true
  }

  prev() {
    if (!this.active || this.done || this.index <= 0) return
    this.index -= 1
    this.render()
  }

  skip() {
    if (!this.active || this.done) return
    this.advance()
  }

  advance() {
    this.index += 1
    if (this.index >= EFFECT_META.length) {
      this.finish()
      return
    }
    this.render()
  }

  finish() {
    this.active = false
    this.done = true
    this.stepCleared = false
    this.onReadyNext?.(false)
    if (this.panel) this.panel.hidden = true
    try {
      localStorage.setItem('snow-night-coach-done', 'v52')
    } catch {
      /* ignore */
    }
    this.onComplete?.()
  }
}

export function shouldStartCoach() {
  try {
    // Explicit opt-out only
    if (new URLSearchParams(location.search).get('coach') === '0') return false
    // Always run the gesture guide when the camera experience starts
    // (user can still tap「跳过指引」). ?coach=1 also forces it.
    return true
  } catch {
    return true
  }
}
