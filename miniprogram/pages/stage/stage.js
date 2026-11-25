const { EFFECT_META } = require('../../utils/effects-meta')
const { readGiftConfig } = require('../../utils/gift')
const { createGestureStub } = require('../../utils/gestures')
const { FEATURES } = require('../../utils/config')

const FRAME_SPOTS = [
  { top: '2%', left: '3%', rot: -14, scale: 0.88, i: 0 },
  { top: '1%', left: '20%', rot: 6, scale: 1, i: 1 },
  { top: '2%', left: '55%', rot: 10, scale: 0.95, i: 2 },
  { top: '1%', left: '85%', rot: -8, scale: 0.85, i: 3 },
  { bottom: '2%', left: '8%', rot: 8, scale: 0.9, i: 4 },
  { bottom: '1%', left: '40%', rot: -12, scale: 1, i: 5 },
  { bottom: '2%', left: '72%', rot: 14, scale: 0.88, i: 6 },
  { top: '30%', left: '1%', rot: -20, scale: 0.8, i: 7 },
  { top: '55%', right: '1%', rot: 16, scale: 0.85, i: 8 },
]

Page({
  data: {
    cameraOn: false,
    loading: true,
    muted: false,
    toast: '',
    coachActive: true,
    freePlay: false,
    coachIndex: 0,
    effects: EFFECT_META,
    currentEffect: EFFECT_META[0],
    coachHint: EFFECT_META[0].hint,
    coachStatus: '可多次练习 · 点「下一步」或比 OK',
    dockHint: null,
    highlightId: '',
    frameDecos: [],
    canvasCssW: 300,
    canvasCssH: 400,
    showDevBar: !FEATURES.gestureRuntime,
    giftHint: '',
  },

  detector: null,
  listener: null,
  overlayCtx: null,
  toastTimer: null,

  onLoad(query) {
    const gift = readGiftConfig(query)
    const skipCoach = query.coach === '0'
    this.detector = createGestureStub()
    this.setData({
      giftHint: gift.hint,
      coachHint: gift.hint && EFFECT_META[0].id === 'a2' ? gift.hint : EFFECT_META[0].hint,
      coachActive: !skipCoach,
      freePlay: !!skipCoach,
      frameDecos: FRAME_SPOTS.map((p, idx) => ({
        id: idx,
        src: `/assets/pixel/frame/deco-${p.i}.png`,
        top: p.top || 'auto',
        left: p.left || 'auto',
        right: p.right || 'auto',
        bottom: p.bottom || 'auto',
        rot: p.rot,
        scale: p.scale,
      })),
    })
    this._authorizeCamera()
  },

  onUnload() {
    this._stopFrameListener()
    if (this.toastTimer) clearTimeout(this.toastTimer)
  },

  _authorizeCamera() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.setData({ cameraOn: true })
          return
        }
        wx.authorize({
          scope: 'scope.camera',
          success: () => this.setData({ cameraOn: true }),
          fail: () => {
            this.setData({ loading: false })
            wx.showModal({
              title: '需要摄像头权限',
              content: '雪夜祝福仅在本地处理画面。请在设置中允许摄像头。',
              confirmText: '去设置',
              success: (r) => {
                if (r.confirm) wx.openSetting()
              },
            })
          },
        })
      },
    })
  },

  onCameraReady() {
    this.setData({ loading: false })
    this._initOverlay()
    this._startFrameListener()
    this._showToast('摄像头已就绪 · 画面本地处理')
  },

  onCameraError(e) {
    this.setData({ loading: false, cameraOn: false })
    console.error('[stage] camera error', e)
    this._showToast('摄像头打开失败')
  },

  _initOverlay() {
    const query = wx.createSelectorQuery()
    query
      .select('#overlay')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res && res[0] && res[0].node
        if (!canvas) return
        const width = res[0].width
        const height = res[0].height
        const dpr = wx.getSystemInfoSync().pixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        this.overlayCtx = ctx
        this.overlayW = width
        this.overlayH = height
        this.setData({ canvasCssW: width, canvasCssH: height })
        this._drawStubOverlay('等待手势…')
      })
  },

  _drawStubOverlay(label) {
    const ctx = this.overlayCtx
    if (!ctx) return
    const w = this.overlayW || 300
    const h = this.overlayH || 400
    ctx.clearRect(0, 0, w, h)
    // 轻量环境雪点（本地绘制，无上传）
    ctx.fillStyle = 'rgba(242, 230, 208, 0.55)'
    for (let i = 0; i < 24; i++) {
      const x = (i * 47 + Date.now() / 40) % w
      const y = (i * 73 + Date.now() / 30) % h
      ctx.fillRect(x, y, 2, 2)
    }
    ctx.save()
    ctx.scale(-1, 1)
    ctx.fillStyle = 'rgba(244, 236, 216, 0.75)'
    ctx.font = '12px sans-serif'
    ctx.fillText(label, -w + 12, 24)
    ctx.restore()
  },

  /**
   * Camera frame callback stub.
   * TODO: 将 frame 送入手势 runtime（本地模型），禁止默认上传。
   */
  _startFrameListener() {
    if (!this.data.cameraOn) return
    try {
      const cam = wx.createCameraContext()
      const listener = cam.onCameraFrame((frame) => {
        // frame: { width, height, data: ArrayBuffer }
        // v1：不解析像素，仅偶尔刷新 stub 叠层
        if (!this._frameTick) this._frameTick = 0
        this._frameTick += 1
        if (this._frameTick % 15 === 0) {
          const result = this.detector.update({
            width: frame.width,
            height: frame.height,
            // data intentionally unused in stub
          })
          if (FEATURES.cameraFrameDebug && this._frameTick % 60 === 0) {
            this._showToast(`帧 ${frame.width}×${frame.height}`)
          }
          this._handleGestureResult(result)
          this._drawStubOverlay(
            FEATURES.gestureRuntime ? '手势识别中' : '手势 stub · 用面板练习'
          )
        }
      })
      listener.start()
      this.listener = listener
    } catch (err) {
      console.warn('[stage] onCameraFrame unavailable', err)
      // 模拟器可能不支持帧回调；UI 仍可用手动引导
    }
  },

  _stopFrameListener() {
    if (this.listener && typeof this.listener.stop === 'function') {
      try {
        this.listener.stop()
      } catch (e) {
        // ignore
      }
    }
    this.listener = null
  },

  _handleGestureResult(result) {
    if (!result || !result.events || !result.events.length) return
    const events = result.events
    if (this.data.coachActive) {
      const step = EFFECT_META[this.data.coachIndex]
      if (events.includes(step.id)) {
        this.setData({
          coachStatus: '做对了！点「下一步」或比 OK',
          highlightId: step.id,
        })
      }
      if (events.includes('next')) {
        this.onCoachNext()
      }
      return
    }
    // 自由模式：优先展示第一个事件
    const id = events[0]
    const meta = EFFECT_META.find((m) => m.id === id)
    if (meta) {
      this.setData({ highlightId: id, dockHint: meta })
      this._showToast(meta.name)
    }
  },

  _showToast(msg) {
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.setData({ toast: msg })
    this.toastTimer = setTimeout(() => this.setData({ toast: '' }), 1800)
  },

  _syncCoach() {
    const m = EFFECT_META[this.data.coachIndex]
    const hint =
      m.id === 'a2' ? this.data.giftHint || m.hint : m.hint
    this.setData({
      currentEffect: m,
      coachHint: hint,
      coachStatus: '可多次练习 · 点「下一步」或比 OK',
      highlightId: m.id,
    })
  },

  onCoachPrev() {
    if (this.data.coachIndex <= 0) return
    this.setData({ coachIndex: this.data.coachIndex - 1 }, () => this._syncCoach())
  },

  onCoachSkip() {
    this.onCoachNext()
  },

  onCoachNext() {
    const next = this.data.coachIndex + 1
    if (next >= EFFECT_META.length) {
      this._enterFreePlay()
      return
    }
    this.setData({ coachIndex: next }, () => this._syncCoach())
  },

  onSkipAll() {
    this._enterFreePlay()
  },

  onReplayCoach() {
    this.setData(
      {
        coachActive: true,
        freePlay: false,
        coachIndex: 0,
      },
      () => this._syncCoach()
    )
  },

  _enterFreePlay() {
    this.setData({
      coachActive: false,
      freePlay: true,
      highlightId: '',
    })
    this._showToast('自由体验开始')
  },

  onDockTap(e) {
    const id = e.currentTarget.dataset.id
    const meta = EFFECT_META.find((m) => m.id === id)
    if (meta) {
      this.setData({ dockHint: meta, highlightId: id })
    }
  },

  onDebugEffect(e) {
    const id = e.currentTarget.dataset.id
    const result = this.detector.debugEmit(id)
    this._handleGestureResult(result)
    if (!this.data.coachActive) {
      const meta = EFFECT_META.find((m) => m.id === id)
      if (meta) this._showToast(`触发 · ${meta.name}`)
    }
  },

  onToggleMute() {
    this.setData({ muted: !this.data.muted })
    // TODO: 接入短音效（InnerAudioContext），对齐 web audio.js
  },

  onCustomize() {
    wx.navigateTo({ url: '/pages/customize/customize' })
  },
})
