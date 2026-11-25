var giftUtil = require('../../utils/gift')
var BOX_STYLES = giftUtil.BOX_STYLES
var DEFAULT_GIFT = giftUtil.DEFAULT_GIFT
var MAX_BLESSING = giftUtil.MAX_BLESSING
var MAX_SIGNATURE = giftUtil.MAX_SIGNATURE
var readGiftConfig = giftUtil.readGiftConfig
var persistGiftConfig = giftUtil.persistGiftConfig
var buildShareQuery = giftUtil.buildShareQuery
var clampBlessing = giftUtil.clampBlessing
var clampSignature = giftUtil.clampSignature
var textLen = giftUtil.textLen

Page({
  data: {
    blessing: DEFAULT_GIFT.blessing,
    signature: '',
    selectedBox: DEFAULT_GIFT.box,
    boxStyles: BOX_STYLES,
    maxBlessing: MAX_BLESSING,
    maxSignature: MAX_SIGNATURE,
    blessCount: 0,
    sigCount: 0,
    shareQuery: '',
  },

  onLoad: function (query) {
    var gift = readGiftConfig(query)
    this.setData({
      blessing: gift.blessing,
      signature: gift.signature,
      selectedBox: gift.box,
      blessCount: textLen(gift.blessing),
      sigCount: textLen(gift.signature),
    })
  },

  onBack: function () {
    var pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  onBlessingInput: function (e) {
    var blessing = clampBlessing(e.detail.value)
    this.setData({
      blessing: blessing,
      blessCount: textLen(blessing),
    })
  },

  onSignatureInput: function (e) {
    var signature = clampSignature(e.detail.value)
    this.setData({
      signature: signature,
      sigCount: textLen(signature),
    })
  },

  onPickBox: function (e) {
    this.setData({ selectedBox: e.currentTarget.dataset.box })
  },

  _currentConfig: function () {
    return {
      blessing: this.data.blessing || DEFAULT_GIFT.blessing,
      signature: this.data.signature,
      box: this.data.selectedBox,
    }
  },

  onSave: function () {
    var config = persistGiftConfig(this._currentConfig())
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(function () {
      wx.navigateTo({
        url: '/pages/stage/stage?' + buildShareQuery(config),
      })
    }, 400)
  },

  onSharePreview: function () {
    var config = persistGiftConfig(this._currentConfig())
    this.setData({ shareQuery: buildShareQuery(config) })
  },

  onCopyQuery: function () {
    var text = 'pages/stage/stage?' + this.data.shareQuery
    wx.setClipboardData({
      data: text,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' })
      },
    })
  },
})
