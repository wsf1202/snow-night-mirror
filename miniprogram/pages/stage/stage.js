var effectsUtil = require('../../utils/effects.js')
var giftUtil = require('../../utils/gift.js')
var gestures = require('../../utils/gestures.js')
var config = require('../../utils/config.js')

var EFFECT_META = effectsUtil.EFFECT_META

Page({
  data: {
    cameraOn: false,
    loading: true,
    toast: '',
    coachActive: true,
    freePlay: false,
    coachIndex: 0,
    effects: EFFECT_META,
    currentEffect: EFFECT_META[0],
    coachHint: EFFECT_META[0].hint,
    coachStatus: '可多次练习 · 点「下一步」',
    dockHint: null,
    highlightId: '',
    showDevBar: !config.FEATURES.gestureRuntime,
    giftHint: ''
  },

  detector: null,
  toastTimer: null,

  onLoad: function (query) {
    var gift = giftUtil.readGiftConfig(query)
    var skipCoach = query.coach === '0'
    this.detector = gestures.createGestureStub()
    this.setData({
      giftHint: gift.hint,
      coachHint: EFFECT_META[0].hint,
      coachActive: !skipCoach,
      freePlay: !!skipCoach,
      loading: true
    })
    this._askCamera()
  },

  onUnload: function () {
    if (this.toastTimer) clearTimeout(this.toastTimer)
  },

  _askCamera: function () {
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
              }
            })
          }
        })
      }
    })
  },

  onCameraReady: function () {
    this.setData({ loading: false })
    this._toast('摄像头已就绪 · 画面本地处理')
  },

  onCameraError: function () {
    this.setData({ loading: false, cameraOn: false })
    this._toast('摄像头打开失败')
  },

  _toast: function (msg) {
    var self = this
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.setData({ toast: msg })
    this.toastTimer = setTimeout(function () {
      self.setData({ toast: '' })
    }, 1600)
  },

  _syncCoach: function () {
    var m = EFFECT_META[this.data.coachIndex]
    var hint = m.id === 'a2' ? (this.data.giftHint || m.hint) : m.hint
    this.setData({
      currentEffect: m,
      coachHint: hint,
      coachStatus: '可多次练习 · 点「下一步」',
      highlightId: m.id
    })
  },

  onPrev: function () {
    var self = this
    if (this.data.coachIndex <= 0) return
    this.setData({ coachIndex: this.data.coachIndex - 1 }, function () {
      self._syncCoach()
    })
  },

  onSkipStep: function () {
    this.onNext()
  },

  onNext: function () {
    var self = this
    var next = this.data.coachIndex + 1
    if (next >= EFFECT_META.length) {
      this._enterFree()
      return
    }
    this.setData({ coachIndex: next }, function () {
      self._syncCoach()
    })
  },

  onSkipAll: function () {
    this._enterFree()
  },

  onReplay: function () {
    var self = this
    this.setData({
      coachActive: true,
      freePlay: false,
      coachIndex: 0
    }, function () {
      self._syncCoach()
    })
  },

  _enterFree: function () {
    this.setData({
      coachActive: false,
      freePlay: true,
      highlightId: ''
    })
    this._toast('自由体验开始')
  },

  onDockTap: function (e) {
    var meta = effectsUtil.findEffect(e.currentTarget.dataset.id)
    if (meta) {
      this.setData({ dockHint: meta, highlightId: meta.id })
    }
  },

  onDebug: function (e) {
    var id = e.currentTarget.dataset.id
    var result = this.detector.debugEmit(id)
    if (result.events && result.events.length) {
      var meta = effectsUtil.findEffect(id)
      if (meta) {
        this.setData({ highlightId: id, dockHint: meta })
        this._toast(meta.name)
      }
    }
  },

  onCustomize: function () {
    wx.navigateTo({ url: '/pages/customize/customize' })
  }
})
