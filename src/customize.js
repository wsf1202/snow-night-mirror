import './style.css'
import './style-vintage.css'
import './style-paper.css'
import './style-neon.css'
import {
  BOX_STYLES,
  MAX_BLESSING,
  MAX_SIGNATURE,
  DEFAULT_GIFT,
  clampBlessing,
  clampSignature,
  buildShareUrl,
  persistGiftConfig,
  readGiftConfig,
  resolveBox,
} from './gift.js'
import {
  resolveArtStyle,
  persistArtStyle,
  styleHomeHref,
} from './artStyle.js'
import { VINTAGE } from './vintageAssets.js'
import { PAPER } from './paperAssets.js'
import { NEON } from './neonAssets.js'

const BASE = import.meta.env.BASE_URL
const art = resolveArtStyle()
persistArtStyle(art.id)
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
if (art.id === 'neon') {
  document.documentElement.style.setProperty(
    '--neon-hero',
    `url("${NEON.heroNeon}")`,
  )
}
const CUSTOMIZE_TITLE = {
  pixel: '定制礼物 · 像素雪夜',
  vintage: '定制礼物 · 复古明信片',
  paper: '定制礼物 · 纸艺立体',
  neon: '定制礼物 · 霓虹',
}
document.title = CUSTOMIZE_TITLE[art.id] || CUSTOMIZE_TITLE.pixel

const homeHref = styleHomeHref(art.id, BASE)
const initial = readGiftConfig()

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="ambient-snow" id="ambientSnow" aria-hidden="true"></div>
  <main class="page-customize">
    <a class="nav-back" href="${homeHref}">← 返回体验</a>
    <h1 class="customize-brand">定制礼物</h1>
    <p class="customize-sub">写下一句祝福（≤${MAX_BLESSING} 字），生成可分享链接。朋友打开后，双手比心就能看见你的专属礼物。</p>

    <form class="form-block" id="giftForm">
      <div class="field">
        <label for="blessing">祝福文案 <span class="meta" id="blessCount">0/${MAX_BLESSING}</span></label>
        <textarea id="blessing" name="blessing" rows="2" maxlength="${MAX_BLESSING}" required placeholder="圣诞快乐！"></textarea>
      </div>

      <div class="field">
        <label for="signature">署名（可选） <span class="meta" id="sigCount">0/${MAX_SIGNATURE}</span></label>
        <input id="signature" name="signature" maxlength="${MAX_SIGNATURE}" placeholder="例如：小雪" />
      </div>

      <div class="field">
        <label>礼物盒外观</label>
        <div class="box-picks" id="boxPicks" role="group" aria-label="礼物盒外观"></div>
      </div>

      <div class="cta-row" style="justify-content:flex-start;margin-top:0.5rem">
        <button type="submit" class="btn btn-primary">生成分享链接</button>
        <a class="btn btn-ghost" id="previewLink" href="${homeHref}">先去体验</a>
      </div>
    </form>

    <div class="share-result" id="shareResult" hidden>
      <label for="shareUrl">专属链接</label>
      <div class="share-row">
        <input id="shareUrl" readonly />
        <button type="button" class="btn btn-primary" id="copyBtn">复制</button>
      </div>
      <p class="privacy-note" style="margin-top:0.85rem;text-align:left">
        祝福文案写在链接参数里；摄像头画面仍只在对方浏览器本地处理。
      </p>
    </div>

    <p class="footer-mini">雪夜祝福 · ${art.label} · Phase 1 · 文案定制</p>
  </main>
`

seedAmbientSnow()

const blessingEl = document.getElementById('blessing')
const signatureEl = document.getElementById('signature')
const blessCount = document.getElementById('blessCount')
const sigCount = document.getElementById('sigCount')
const boxPicks = document.getElementById('boxPicks')
const form = document.getElementById('giftForm')
const shareResult = document.getElementById('shareResult')
const shareUrl = document.getElementById('shareUrl')
const copyBtn = document.getElementById('copyBtn')
const previewLink = document.getElementById('previewLink')

let selectedBox = initial.box || DEFAULT_GIFT.box

blessingEl.value = initial.blessing
signatureEl.value = initial.signature || ''
updateCounts()

boxPicks.innerHTML = BOX_STYLES.map((b) => {
  const pressed = b.id === selectedBox
  return `
    <button type="button" class="box-pick" data-box="${b.id}" aria-pressed="${pressed}">
      <span class="box-swatch" style="background:${b.box};--ribbon:${b.ribbon}"></span>
      <span>${b.label}</span>
    </button>
  `
}).join('')

boxPicks.addEventListener('click', (e) => {
  const btn = e.target.closest('.box-pick')
  if (!btn) return
  selectedBox = btn.dataset.box
  for (const el of boxPicks.querySelectorAll('.box-pick')) {
    el.setAttribute('aria-pressed', String(el.dataset.box === selectedBox))
  }
})

blessingEl.addEventListener('input', updateCounts)
signatureEl.addEventListener('input', updateCounts)

form.addEventListener('submit', (e) => {
  e.preventDefault()
  const config = {
    blessing: clampBlessing(blessingEl.value) || DEFAULT_GIFT.blessing,
    signature: clampSignature(signatureEl.value),
    box: resolveBox(selectedBox).id,
  }
  persistGiftConfig(config)
  const url = buildShareUrl(config, window.location.origin, { style: art.id })
  shareUrl.value = url
  previewLink.href = url
  shareResult.hidden = false
  shareResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copyBtn.textContent = '已复制'
    setTimeout(() => {
      copyBtn.textContent = '复制'
    }, 1500)
  } catch {
    shareUrl.select()
    copyBtn.textContent = '请手动复制'
  }
})

function updateCounts() {
  blessCount.textContent = `${[...blessingEl.value].length}/${MAX_BLESSING}`
  sigCount.textContent = `${[...signatureEl.value].length}/${MAX_SIGNATURE}`
}

function seedAmbientSnow() {
  const root = document.getElementById('ambientSnow')
  if (!root) return
  const paperFlakes =
    art.id === 'paper'
      ? [
          `${BASE}paper/snowflake.png?v=8`,
          `${BASE}paper/snowflake-b.png?v=8`,
          `${BASE}paper/snowflake-c.png?v=8`,
        ]
      : null
  const count = paperFlakes ? 16 : 22
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
