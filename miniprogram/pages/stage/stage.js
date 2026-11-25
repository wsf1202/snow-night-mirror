var effectsMeta = require('../../utils/effects-meta')
var giftUtil = require('../../utils/gift')
var gestures = require('../../utils/gestures')
var config = require('../../utils/config')

var EFFECT_META = effectsMeta.EFFECT_META
var readGiftConfig = giftUtil.readGiftConfig
var createGestureStub = gestures.createGestureStub
var FEATURES = config.FEATURES

var FRAME_SPOTS = [
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

function findEffect(id) {
  for (var i = 0; i < EFFECT_META.length; i++) {
    if (EFFECT_META[i].id === id) return EFFECT_META[i]
  }
  return null
}

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

  onLoad: function (query) {
    var gift = readGiftConfig(query)
    var skipCoach = query.coach === '0'
    this.detector = createGestureStub()
    this.setData({
      giftHint: gift.hint,
      coachHint: gift.hint && EFFECT_META[0].id === 'a2' ? gift.hint : EFFECT_META[0].hint,
      coachActive: !skipCoach,
      freePlay: !!skipCoach,
      frameDecos: FRAME_SPOTS.map(function (p, idx) {
        return {
          id: idx,
          src: '/assets/pixel/frame/deco-' + p.i + '.png',
          top: p.top || 'auto',
          left: p.left || 'auto',
          right: p.right || 'auto',
          bottom: p.bottom || 'auto',
          rot: p.rot,
          scale: p.scale,
        }
      }),
    })
    this._authorizeCamera()
  },

  onUnload: function () {
    this._stopFrameListener()
    if (this.toastTimer) clearTimeout(this.toastTimer)
  },

  _authorizeCamera: function () {
    var self = this
    wx.getSetting({
      success: function (res) {
        if (res.authSetting['scope.camera']) {
          self.setData({ cameraOn: true })
          return
        }
        wx.authorize({
          scope: 'scope.camera',
          success: function () {
            self.setData({ cameraOn: true })
          },
          fail: function () {
            self.setData({ loading: false })
            wx.showModal({
              title: '需要摄像头权限',
              content: '雪夜祝福仅在本地处理画面。请在设置中允许摄像头。',
              confirmText: '去设置',
              success: function (r) {
                if (r.confirm) wx.openSetting()
              },
            })
          },
        })
      },
    })
  },

  onCameraReady: function () {
    this.setData({ loading: false })
    this._initOverlay()
    this._startFrameListener()
    this._showToast('摄像头已就绪 · 画面本地处理')
  },

  onCameraError: function (e) {
    this.setData({ loading: false, cameraOn: false })
    console.error('[stage] camera error', e)
    this._showToast('摄像头打开失败')
  },

  _initOverlay: function () {
    var self = this
    var query = wx.createSelectorQuery()
    query
      .select('#overlay')
      .fields({ node: true, size: true })
      .exec(function (res) {
        var canvas = res && res[0] && res[0].node
        if (!canvas) return
        var width = res[0].width
        var height = res[0].height
        var dpr = wx.getSystemInfoSync().pixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        var ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        self.overlayCtx = ctx
        self.overlayW = width
        self.overlayH = height
        self.setData({ canvasCssW: width, canvasCssH: height })
        self._drawStubOverlay('等待手势…')
      })
  },

  _drawStubOverlay: function (label) {
    var ctx = this.overlayCtx
    if (!ctx) return
    var w = this.overlayW || 300
    var h = this.overlayH || 400
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(242, 230, 208, 0.55)'
    for (var i = 0; i < 24; i++) {
      var x = (i * 47 + Date.now() / 40) % w
      var y = (i * 73 + Date.now() / 30) % h
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
  _startFrameListener: function () {
    var self = this
    if (!this.data.cameraOn) return
    try {
      var cam = wx.createCameraContext()
      var listener = cam.onCameraFrame(function (frame) {
        if (!self._frameTick) self._frameTick = 0
        self._frameTick += 1
        if (self._frameTick % 15 === 0) {
          var result = self.detector.update({
            width: frame.width,
            height: frame.height,
          })
          if (FEATURES.cameraFrameDebug && self._frameTick % 60 === 0) {
            self._showToast('帧 ' + frame.width + 'x' + frame.height)
          }
          self._handleGestureResult(result)
          self._drawStubOverlay(
            FEATURES.gestureRuntime ? '手势识别中' : '手势 stub · 用面板练习'
          )
        }
      })
      listener.start()
      this.listener = listener
    } catch (err) {
      console.warn('[stage] onCameraFrame unavailable', err)
    }
  },

  _stopFrameListener: function () {
    if (this.listener && typeof this.listener.stop === 'function') {
      try {
        this.listener.stop()
      } catch (e) {
        // ignore
      }
    }
    this.listener = null
  },

  _handleGestureResult: function (result) {
    if (!result || !result.events || !result.events.length) return
    var events = result.events
    var self = this
    if (this.data.coachActive) {
      var step = EFFECT_META[this.data.coachIndex]
      if (events.indexOf(step.id) !== -1) {
        this.setData({
          coachStatus: '做对了！点「下一步」或比 OK',
          highlightId: step.id,
        })
      }
      if (events.indexOf('next') !== -1) {
        this.onCoachNext()
      }
      return
    }
    var id = events[0]
    var meta = findEffect(id)
    if (meta) {
      this.setData({ highlightId: id, dockHint: meta })
      this._showToast(meta.name)
    }
  },

  _showToast: function (msg) {
    var self = this
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.setData({ toast: msg })
    this.toastTimer = setTimeout(function () {
      self.setData({ toast: '' })
    }, 1800)
  },

  _syncCoach: function () {
    var m = EFFECT_META[this.data.coachIndex]
    var hint = m.id === 'a2' ? this.data.giftHint || m.hint : m.hint
    this.setData({
      currentEffect: m,
      coachHint: hint,
      coachStatus: '可多次练习 · 点「下一步」或比 OK',
      highlightId: m.id,
    })
  },

  onCoachPrev: function () {
    var self = this
    if (this.data.coachIndex <= 0) return
    this.setData({ coachIndex: this.data.coachIndex - 1 }, function () {
      self._syncCoach()
    })
  },

  onCoachSkip: function () {
    this.onCoachNext()
  },

  onCoachNext: function () {
    var self = this
    var next = this.data.coachIndex + 1
    if (next >= EFFECT_META.length) {
      this._enterFreePlay()
      return
    }
    this.setData({ coachIndex: next }, function () {
      self._syncCoach()
    })
  },

  onSkipAll: function () {
    this._enterFreePlay()
  },

  onReplayCoach: function () {
    var self = this
    this.setData(
      {
        coachActive: true,
        freePlay: false,
        coachIndex: 0,
      },
      function () {
        self._syncCoach()
      }
    )
  },

  _enterFreePlay: function () {
    this.setData({
      coachActive: false,
      freePlay: true,
      highlightId: '',
    })
    this._showToast('自由体验开始')
  },

  onDockTap: function (e) {
    var id = e.currentTarget.dataset.id
    var meta = findEffect(id)
    if (meta) {
      this.setData({ dockHint: meta, highlightId: id })
    }
  },

  onDebugEffect: function (e) {
    var id = e.currentTarget.dataset.id
    var result = this.detector.debugEmit(id)
    this._handleGestureResult(result)
    if (!this.data.coachActive) {
      var meta = findEffect(id)
      if (meta) this._showToast('触发 · ' + meta.name)
    }
  },

  onToggleMute: function () {
    this.setData({ muted: !this.data.muted })
    // TODO: 接入短音效（InnerAudioContext）
  },

  onCustomize: function () {
    wx.navigateTo({ url: '/pages/customize/customize' })
  },
})
