var giftUtil = require('../../utils/gift.js')

Page({
  data: {
    blessing: giftUtil.DEFAULT_GIFT.blessing,
    signature: '',
    selectedBox: giftUtil.DEFAULT_GIFT.box,
    boxStyles: giftUtil.BOX_STYLES,
    maxBlessing: giftUtil.MAX_BLESSING,
    maxSignature: giftUtil.MAX_SIGNATURE,
    blessCount: 0,
    sigCount: 0,
    shareQuery: ''
  },

  onLoad: function (query) {
    var gift = giftUtil.readGiftConfig(query)
    this.setData({
      blessing: gift.blessing,
      signature: gift.signature,
      selectedBox: gift.box,
      blessCount: giftUtil.textLen(gift.blessing),
      sigCount: giftUtil.textLen(gift.signature)
    })
  },

  onBack: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  onBlessingInput: function (e) {
    var blessing = giftUtil.clampBlessing(e.detail.value)
    this.setData({
      blessing: blessing,
      blessCount: giftUtil.textLen(blessing)
    })
  },

  onSignatureInput: function (e) {
    var signature = giftUtil.clampSignature(e.detail.value)
    this.setData({
      signature: signature,
      sigCount: giftUtil.textLen(signature)
    })
  },

  onPickBox: function (e) {
    this.setData({ selectedBox: e.currentTarget.dataset.box })
  },

  _config: function () {
    return {
      blessing: this.data.blessing || giftUtil.DEFAULT_GIFT.blessing,
      signature: this.data.signature,
      box: this.data.selectedBox
    }
  },

  onSave: function () {
    var config = giftUtil.persistGiftConfig(this._config())
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(function () {
      wx.navigateTo({
        url: '/pages/stage/stage?' + giftUtil.buildShareQuery(config)
      })
    }, 400)
  },

  onSharePreview: function () {
    var config = giftUtil.persistGiftConfig(this._config())
    this.setData({ shareQuery: giftUtil.buildShareQuery(config) })
  },

  onCopy: function () {
    wx.setClipboardData({
      data: 'pages/stage/stage?' + this.data.shareQuery,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }
})
