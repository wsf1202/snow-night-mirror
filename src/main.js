import './style.css'
import './style-vintage.css'
import './style-paper.css'
import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import { EffectsEngine, EFFECT_META, configureEffectsArt } from './effects.js'
import { GestureDetector } from './gestures.js'
import { readGiftConfig } from './gift.js'
import {
  loadMutePreference,
  setMuted,
  isMuted,
  resetCarol,
} from './audio.js'
import { openCamera } from './camera.js'
import { GestureCoach, shouldStartCoach } from './coach.js'
import { preloadPixelAssets } from './pixelAssets.js'
import { preloadVintageAssets, VINTAGE } from './vintageAssets.js'
import { preloadPaperAssets, PAPER } from './paperAssets.js'
import {
  resolveArtStyle,
  persistArtStyle,
  styleHomeHref,
  withStyleParam,
  soloStyleId,
} from './artStyle.js'

const BASE = import.meta.env.BASE_URL
const art = resolveArtStyle()
persistArtStyle(art.id)
configureEffectsArt(art.id)
document.documentElement.classList.add(`art-${art.id}`)
document.body?.classList.add(`art-${art.id}`)
if (art.id === 'vintage') {
  document.documentElement.style.setProperty(
    '--vintage-hero',
    `url("${VINTAGE.heroPostcard}")`,
  )
}
if (art.id === 'paper') {
  document.documentElement.style.setProperty(
    '--paper-hero',
    `url("${PAPER.heroPaper}")`,
  )
}
const TITLE_BY_STYLE = {
  pixel: '雪夜祝福 · 像素圣诞镜',
  vintage: '雪夜祝福 · 复古明信片',
  paper: '雪夜祝福 · 纸艺立体',
}
document.title = TITLE_BY_STYLE[art.id] || TITLE_BY_STYLE.pixel

const WASM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const gift = readGiftConfig()
loadMutePreference()

const customizeHref = withStyleParam(`${BASE}customize.html`, art.id)
const assetRoot = art.assetRoot

function heroSpritesHtml() {
  if (art.id === 'vintage') {
    return `
        <img class="hs hs-stamp" src="${BASE}vintage/stamp.png?v=1" alt="" />
        <img class="hs hs-tree" src="${BASE}vintage/tree.png?v=1" alt="" />
        <img class="hs hs-wreath" src="${BASE}vintage/wreath.png?v=1" alt="" />
        <img class="hs hs-gift" src="${BASE}vintage/gift.png?v=1" alt="" />
        <img class="hs hs-bell" src="${BASE}vintage/bell.png?v=1" alt="" />
        <img class="hs hs-hat" src="${BASE}vintage/santa-hat.png?v=1" alt="" />
        <img class="hs hs-candle" src="${BASE}vintage/candle.png?v=1" alt="" />
        <img class="hs hs-holly" src="${BASE}vintage/frame/deco-0.png?v=1" alt="" />
        <img class="hs hs-pine" src="${BASE}vintage/frame/deco-2.png?v=1" alt="" />
    `
  }
  if (art.id === 'paper') {
    return `
        <img class="hs hs-star" src="${BASE}paper/star.png?v=3" alt="" />
        <img class="hs hs-tree" src="${BASE}paper/tree.png?v=3" alt="" />
        <img class="hs hs-gift" src="${BASE}paper/gift.png?v=3" alt="" />
        <img class="hs hs-bell" src="${BASE}paper/bell.png?v=3" alt="" />
        <img class="hs hs-hat" src="${BASE}paper/santa-hat.png?v=3" alt="" />
        <img class="hs hs-bow" src="${BASE}paper/bow.png?v=3" alt="" />
        <img class="hs hs-ornament" src="${BASE}paper/ornament.png?v=3" alt="" />
        <img class="hs hs-holly" src="${BASE}paper/frame/deco-0.png?v=3" alt="" />
        <img class="hs hs-pine" src="${BASE}paper/frame/deco-2.png?v=3" alt="" />
    `
  }
  return `
        <img class="hs hs-tree" src="${BASE}pixel/tree.png?v=49" alt="" />
        <img class="hs hs-gift" src="${BASE}pixel/gift.png?v=52" alt="" />
        <img class="hs hs-bell" src="${BASE}pixel/bell.png" alt="" />
        <img class="hs hs-hat" src="${BASE}pixel/santa-hat.png?v=3" alt="" />
        <img class="hs hs-antlers" src="${BASE}pixel/antlers.png?v=2" alt="" />
        <img class="hs hs-cane" src="${BASE}pixel/frame/deco-0.png?v=53" alt="" />
        <img class="hs hs-holly" src="${BASE}pixel/frame/deco-1.png?v=53" alt="" />
        <img class="hs hs-pine" src="${BASE}pixel/frame/deco-7.png?v=53" alt="" />
  `
}

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="page-experience">
    <div class="ambient-snow" id="ambientSnow" aria-hidden="true"></div>

    <section class="hero" id="hero">
      <div class="hero-sprites" aria-hidden="true">
        ${heroSpritesHtml()}
      </div>
      <div class="hero-inner">
        <p class="hero-pixel-tag">${art.tag}</p>
        <h1 class="brand">
          ${art.brand}
          <span class="brand-latin">${art.brandLatin}</span>
        </h1>
        <p class="hero-lead">
          ${art.lead}
        </p>
        <div class="cta-row">
          <button type="button" class="btn btn-primary" id="startBtn">开启摄像头</button>
          <a class="btn btn-ghost" href="${customizeHref}">定制礼物祝福</a>
        </div>
        ${
          soloStyleId()
            ? ''
            : `<div class="style-picker" role="navigation" aria-label="画风切换">
          <span class="style-picker-label">画风</span>
          <a class="style-chip" href="${styleHomeHref('pixel', BASE)}" aria-current="${art.id === 'pixel' ? 'page' : 'false'}">像素雪夜</a>
          <a class="style-chip" href="${styleHomeHref('vintage', BASE)}" aria-current="${art.id === 'vintage' ? 'page' : 'false'}">复古明信片</a>
          <a class="style-chip" href="${styleHomeHref('paper', BASE)}" aria-current="${art.id === 'paper' ? 'page' : 'false'}">纸艺立体</a>
        </div>`
        }
        <p class="privacy-note">画面仅在浏览器本地处理，不会上传。</p>
      </div>
    </section>

    <section class="stage" id="stage">
      <div class="topbar">
        <div class="topbar-brand">${art.brand}</div>
        <div class="topbar-actions">
          <button type="button" class="icon-btn" id="muteBtn" aria-pressed="${isMuted()}">${isMuted() ? '已静音' : '音效开'}</button>
          <button type="button" class="icon-btn" id="replayCoachBtn" hidden>再看引导</button>
          <a class="icon-btn" href="${customizeHref}">定制礼物</a>
        </div>
      </div>

      <div class="viewport" id="viewport">
        <video id="video" playsinline muted autoplay></video>
        <canvas class="overlay" id="overlay"></canvas>
        <div class="viewport-frame" id="viewportFrame" aria-hidden="true"></div>
        <div class="status-toast" id="toast"></div>
        <div class="coach-slot" id="coachSlot"></div>
        <button type="button" class="btn-skip-guide" id="skipGuideBtn" hidden>跳过指引</button>
        <div class="hint-banner" id="hintBanner" hidden>
          <strong>自由体验</strong>
        </div>
        <div class="loading-veil" id="loadingVeil">
          <div>
            <div class="spinner"></div>
            <p>正在唤醒手势识别…</p>
          </div>
        </div>
      </div>

      <div class="effects-dock" id="effectsDock" aria-label="特效列表"></div>
      <div class="dock-popover" id="dockPopover" hidden>
        <div class="dock-popover-clip" id="dockPopoverClip"></div>
        <div class="dock-popover-copy">
          <strong id="dockPopoverTitle"></strong>
          <span id="dockPopoverHint"></span>
        </div>
      </div>
    </section>
  </div>
`

seedAmbientSnow()

/** Casual pixel décor scattered along the camera viewport edges. */
function seedViewportFrame() {
  const host = document.getElementById('viewportFrame')
  if (!host) return
  // 0–6 props, 7–8 pine sprigs — tuck nearer the rim, with branches between icons
  const spots = [
    { t: 1, l: 3, rot: -14, s: 0.88, i: 0 },
    { t: 0, l: 12, rot: 18, s: 0.75, i: 7 },
    { t: 2, l: 20, rot: 6, s: 1, i: 1 },
    { t: 1, l: 30, rot: -22, s: 0.7, i: 8 },
    { t: 0, l: 38, rot: -3, s: 0.9, i: 3 },
    { t: 3, l: 48, rot: 12, s: 0.8, i: 7 },
    { t: 1, l: 56, rot: 10, s: 1, i: 2 },
    { t: 0, l: 66, rot: -16, s: 0.72, i: 8 },
    { t: 2, l: 74, rot: -8, s: 0.95, i: 6 },
    { t: 1, l: 84, rot: 20, s: 0.78, i: 7 },
    { t: 0, l: 92, rot: 5, s: 0.85, i: 4 },
    { b: 1, l: 4, rot: 8, s: 0.95, i: 2 },
    { b: 0, l: 14, rot: -18, s: 0.72, i: 8 },
    { b: 2, l: 22, rot: -12, s: 0.9, i: 0 },
    { b: 1, l: 32, rot: 15, s: 0.78, i: 7 },
    { b: 0, l: 42, rot: 4, s: 1.05, i: 1 },
    { b: 3, l: 52, rot: -10, s: 0.7, i: 8 },
    { b: 1, l: 60, rot: -6, s: 0.88, i: 5 },
    { b: 0, l: 70, rot: 14, s: 0.8, i: 7 },
    { b: 2, l: 78, rot: 11, s: 1, i: 3 },
    { b: 1, l: 88, rot: -20, s: 0.75, i: 8 },
    { b: 0, l: 95, rot: -4, s: 0.9, i: 6 },
    { t: 14, l: 0, rot: -20, s: 0.85, i: 4 },
    { t: 24, l: 1, rot: 25, s: 0.7, i: 7 },
    { t: 34, l: 0, rot: 9, s: 0.95, i: 1 },
    { t: 44, l: 2, rot: -14, s: 0.72, i: 8 },
    { t: 54, l: 0, rot: -5, s: 0.88, i: 0 },
    { t: 64, l: 1, rot: 18, s: 0.75, i: 7 },
    { t: 74, l: 0, rot: 12, s: 1, i: 2 },
    { t: 84, l: 1, rot: -22, s: 0.7, i: 8 },
    { t: 14, r: 0, rot: 16, s: 0.9, i: 3 },
    { t: 24, r: 1, rot: -24, s: 0.72, i: 8 },
    { t: 34, r: 0, rot: -10, s: 1, i: 6 },
    { t: 44, r: 2, rot: 14, s: 0.78, i: 7 },
    { t: 54, r: 0, rot: 7, s: 0.88, i: 4 },
    { t: 64, r: 1, rot: -18, s: 0.7, i: 8 },
    { t: 74, r: 0, rot: -12, s: 1.05, i: 0 },
    { t: 84, r: 1, rot: 20, s: 0.75, i: 7 },
  ]
  host.innerHTML = spots
    .map((p, idx) => {
      const pos = [
        p.t != null ? `top:${p.t}%` : '',
        p.b != null ? `bottom:${p.b}%` : '',
        p.l != null ? `left:${p.l}%` : '',
        p.r != null ? `right:${p.r}%` : '',
        `transform:rotate(${p.rot}deg) scale(${p.s})`,
      ]
        .filter(Boolean)
        .join(';')
      const decoVer = art.id === 'pixel' ? '53' : art.id === 'paper' ? '3' : '1'
      return `<img class="vf-pixel" src="${BASE}${assetRoot}/frame/deco-${p.i}.png?v=${decoVer}" alt="" style="${pos}" data-i="${idx}" />`
    })
    .join('')
}
seedViewportFrame()

const hero = document.getElementById('hero')
const stage = document.getElementById('stage')
const startBtn = document.getElementById('startBtn')
const video = document.getElementById('video')
const overlay = document.getElementById('overlay')
const loadingVeil = document.getElementById('loadingVeil')
const toast = document.getElementById('toast')
const muteBtn = document.getElementById('muteBtn')
const effectsDock = document.getElementById('effectsDock')
const hintBanner = document.getElementById('hintBanner')
const coachSlot = document.getElementById('coachSlot')
const skipGuideBtn = document.getElementById('skipGuideBtn')
const replayCoachBtn = document.getElementById('replayCoachBtn')
const dockPopover = document.getElementById('dockPopover')
const dockPopoverClip = document.getElementById('dockPopoverClip')
const dockPopoverTitle = document.getElementById('dockPopoverTitle')
const dockPopoverHint = document.getElementById('dockPopoverHint')

const effects = new EffectsEngine(overlay)
const detector = new GestureDetector()

let poseLandmarker = null
let handLandmarker = null
let running = false
let lastVideoTime = -1
let raf = 0
let lastTs = performance.now()
let coach = null
/** Free-play: one effect at a time (bell exempt so carol stays continuous). */
const FREE_TRIGGER_GAP_MS = 750
/** Prefer more specific / two-hand gestures when several fire in one frame. */
const FREE_EVENT_PRIORITY = ['a2', 'b8', 'a6', 'a7', 'a3', 'a1']
let lastFreeTriggerAt = 0

renderDock()
effects.onUnlock(() => renderDock())

muteBtn.addEventListener('click', () => {
  setMuted(!isMuted())
  muteBtn.textContent = isMuted() ? '已静音' : '音效开'
  muteBtn.setAttribute('aria-pressed', String(isMuted()))
})

skipGuideBtn.addEventListener('click', () => {
  if (coach?.active) coach.finish()
  else enterFreePlay()
})

replayCoachBtn.addEventListener('click', () => {
  try {
    localStorage.removeItem('snow-night-coach-done')
  } catch {
    /* ignore */
  }
  startCoach()
})

startBtn.addEventListener('click', () => {
  startExperience().catch((err) => {
    console.error(err)
    showFatal(err)
  })
})

if (new URLSearchParams(location.search).has('b') || new URLSearchParams(location.search).has('blessing')) {
  startBtn.focus()
}

async function startExperience() {
  hero.style.display = 'none'
  stage.classList.add('active')
  loadingVeil.style.display = 'grid'
  loadingVeil.innerHTML = `
    <div>
      <div class="spinner"></div>
      <p>正在请求摄像头权限…</p>
    </div>
  `

  const cam = await openCamera(video)
  loadingVeil.innerHTML = `
    <div>
      <div class="spinner"></div>
      <p>正在唤醒手势识别…</p>
    </div>
  `

  const preloadArt =
    art.id === 'vintage'
      ? preloadVintageAssets()
      : art.id === 'paper'
        ? preloadPaperAssets()
        : preloadPixelAssets()
  await Promise.all([initModels(), preloadArt, effects.reloadArtSprites()])
  resizeStage()
  window.addEventListener('resize', resizeStage)

  loadingVeil.style.display = 'none'
  running = true
  lastTs = performance.now()
  loop()
  showToast(`已连接：${cam.deviceLabel}`)

  if (shouldStartCoach()) startCoach()
  else enterFreePlay()
}

function startCoach() {
  hintBanner.hidden = true
  replayCoachBtn.hidden = true
  skipGuideBtn.hidden = false
  detector.setStrict(true)
  // Replace any prior coach instance so the panel remounts cleanly
  if (coachSlot) coachSlot.innerHTML = ''
  coach = new GestureCoach({
    root: coachSlot,
    giftHint: gift.hint,
    onStep: (m) => {
      highlightDock(m.id)
      detector.setWantNext(false)
      showToast(`指引 ${EFFECT_META.indexOf(m) + 1}/${EFFECT_META.length}：${m.name}`)
    },
    onReadyNext: (ready) => {
      detector.setWantNext(Boolean(ready))
    },
    onComplete: () => {
      detector.setWantNext(false)
      enterFreePlay()
      showToast('已进入自由体验')
    },
  })
  showToast('手势指引开始')
}

function enterFreePlay() {
  if (coach?.active) {
    // finish may re-enter; guard
    const c = coach
    coach = null
    c.active = false
    c.done = true
    if (c.panel) c.panel.hidden = true
  } else {
    coach = null
  }
  detector.setStrict(false)
  detector.setWantNext(false)
  lastFreeTriggerAt = 0
  resetCarol()
  hintBanner.hidden = false
  hintBanner.innerHTML = `<strong>自由体验</strong>`
  replayCoachBtn.hidden = false
  skipGuideBtn.hidden = true
  highlightDock(null)
}

async function initModels() {
  const vision = await FilesetResolver.forVisionTasks(WASM)
  const create = async (delegate) => {
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    })
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: HAND_MODEL, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
    })
  }
  try {
    await create('GPU')
  } catch (e) {
    console.warn('GPU delegate failed, falling back to CPU', e)
    await create('CPU')
  }
}

function resizeStage() {
  const vp = document.getElementById('viewport')
  const rect = vp.getBoundingClientRect()
  effects.resize(rect.width, rect.height)
}

function loop() {
  raf = requestAnimationFrame(loop)
  const now = performance.now()
  const dt = Math.min(0.05, (now - lastTs) / 1000)
  lastTs = now

  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime
    try {
      const pose = poseLandmarker.detectForVideo(video, now)
      const hands = handLandmarker.detectForVideo(video, now)
      const poseLm = pose.landmarks?.[0] || null
      const handLms = hands.landmarks || []
      const { events, anchors } = detector.update(poseLm, handLms, now)
      effects.setLiveAnchors(anchors)
      if (coach?.active) {
        for (const ev of events) {
          if (ev.id === 'next') {
            if (coach.tryAdvanceByGesture()) {
              showToast('下一步')
            }
            continue
          }
          if (coach.current?.id === ev.id) {
            const started = dispatchEffect(ev)
            if (started !== false) coach.notify(ev.id)
          }
        }
      } else {
        // Free play: mutual exclusion + gap — bells & snow always pass (no gap).
        const candidates = events.filter((ev) => ev.id !== 'next')
        const bells = candidates.filter((ev) => ev.id === 'a3')
        const snows = candidates.filter((ev) => ev.id === 'a1')
        const others = candidates.filter((ev) => ev.id !== 'a3' && ev.id !== 'a1')
        if (bells.length) dispatchEffect(bells[0])
        if (snows.length) dispatchEffect(snows[0])
        if (others.length && now - lastFreeTriggerAt >= FREE_TRIGGER_GAP_MS) {
          others.sort(
            (a, b) =>
              FREE_EVENT_PRIORITY.indexOf(a.id) - FREE_EVENT_PRIORITY.indexOf(b.id),
          )
          const pick = others.find((ev) => FREE_EVENT_PRIORITY.includes(ev.id))
          if (pick) {
            dispatchEffect(pick)
            lastFreeTriggerAt = now
          }
        }
      }
    } catch (e) {
      console.warn('detect', e)
    }
  }

  effects.update(dt)
  effects.draw()
}

function dispatchEffect(ev) {
  const p = ev.payload || {}
  switch (ev.id) {
    case 'a1':
      effects.triggerSnowBlessing(p)
      showToast('飘雪祝福')
      return true
    case 'a2': {
      const ok = effects.triggerGiftDrop(gift, p)
      if (ok) showToast('专属礼物')
      return ok
    }
    case 'a3':
      effects.triggerBells(p)
      showToast('圣诞铃响')
      return true
    case 'a7':
      effects.triggerSantaHat()
      showToast('圣诞帽')
      return true
    case 'a6':
      effects.triggerReindeer(p)
      showToast('驯鹿鹿角')
      return true
    case 'b8':
      effects.triggerTree(p)
      showToast('圣诞树点灯')
      return true
    default:
      return false
  }
}

function renderDock() {
  effectsDock.innerHTML = EFFECT_META.map((m) => {
    const on = effects.unlocked.has(m.id) ? 'on' : ''
    return `<button type="button" class="effect-chip ${on}" data-id="${m.id}" aria-label="${m.name}：${m.hint}">${m.name}</button>`
  }).join('')

  for (const chip of effectsDock.querySelectorAll('.effect-chip')) {
    chip.addEventListener('pointerenter', () => showDockPopover(chip))
    chip.addEventListener('pointermove', () => showDockPopover(chip))
    chip.addEventListener('focus', () => showDockPopover(chip))
    chip.addEventListener('pointerleave', hideDockPopover)
    chip.addEventListener('blur', hideDockPopover)
  }
}

function highlightDock(id) {
  for (const chip of effectsDock.querySelectorAll('.effect-chip')) {
    chip.classList.toggle('current', id != null && chip.dataset.id === id)
  }
}

function showDockPopover(chip) {
  const m = EFFECT_META.find((x) => x.id === chip.dataset.id)
  if (!m) return
  dockPopover.hidden = false
  dockPopoverClip.innerHTML = `<img class="dock-guide-img" src="${m.guide}" alt="" />`
  dockPopoverTitle.textContent = m.name
  dockPopoverHint.textContent = m.id === 'a2' ? gift.hint : m.hint

  const chipRect = chip.getBoundingClientRect()
  const stageRect = stage.getBoundingClientRect()
  const left = chipRect.left - stageRect.left + chipRect.width / 2
  const bottom = stageRect.bottom - chipRect.top + 10
  dockPopover.style.left = `${left}px`
  dockPopover.style.bottom = `${bottom}px`
  dockPopover.style.transform = 'translateX(-50%)'
}

function hideDockPopover() {
  dockPopover.hidden = true
}

let toastTimer = 0
function showToast(msg) {
  toast.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800)
}

function showFatal(err) {
  loadingVeil.style.display = 'grid'
  const secure = window.isSecureContext
  const name = err?.name || ''
  let detail = '请检查设备后重试。'
  if (!secure) detail = '请使用 HTTPS 或 localhost 打开本页。'
  else if (name === 'NotFoundError' || /Requested device not found/i.test(err?.message || '')) {
    detail = err?.message || '浏览器未找到可用摄像头。'
  } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    detail = '摄像头权限被拒绝。请在地址栏允许摄像头后重试。'
  } else if (name === 'NotReadableError') {
    detail = '摄像头正被其他应用占用，请关闭后重试。'
  } else if (err?.message) detail = err.message

  loadingVeil.innerHTML = `
    <div class="error-box">
      <p><strong>无法启动摄像头</strong></p>
      <p>${escapeHtml(detail)}</p>
      <p style="margin-top:1rem"><button class="btn btn-primary" type="button" id="retryCamBtn">重试</button></p>
    </div>
  `
  document.getElementById('retryCamBtn')?.addEventListener('click', () => {
    loadingVeil.innerHTML = `<div><div class="spinner"></div><p>正在重新请求摄像头…</p></div>`
    startExperience().catch((e) => {
      console.error(e)
      showFatal(e)
    })
  })
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function seedAmbientSnow() {
  const root = document.getElementById('ambientSnow')
  if (!root) return
  const paperFlakes =
    art.id === 'paper'
      ? [
          `${BASE}paper/snowflake.png?v=6`,
          `${BASE}paper/snowflake-b.png?v=6`,
          `${BASE}paper/snowflake-c.png?v=6`,
        ]
      : null
  const count = paperFlakes ? 18 : 28
  for (let i = 0; i < count; i++) {
    if (paperFlakes) {
      const img = document.createElement('img')
      img.className = 'ambient-flake'
      img.src = paperFlakes[i % paperFlakes.length]
      img.alt = ''
      img.style.left = `${Math.random() * 100}%`
      img.style.animationDuration = `${10 + Math.random() * 16}s`
      img.style.animationDelay = `${-Math.random() * 14}s`
      img.style.opacity = String(0.18 + Math.random() * 0.28)
      const size = `${7 + Math.random() * 11}px`
      img.style.width = size
      img.style.height = size
      root.appendChild(img)
    } else {
      const s = document.createElement('span')
      s.style.left = `${Math.random() * 100}%`
      s.style.animationDuration = `${8 + Math.random() * 14}s`
      s.style.animationDelay = `${-Math.random() * 12}s`
      s.style.opacity = String(0.25 + Math.random() * 0.45)
      s.style.width = s.style.height = `${2 + Math.random() * 4}px`
      root.appendChild(s)
    }
  }
}

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(raf)
  const stream = video.srcObject
  if (stream) stream.getTracks().forEach((t) => t.stop())
})
