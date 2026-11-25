const {
  BOX_STYLES,
  DEFAULT_GIFT,
  MAX_BLESSING,
  MAX_SIGNATURE,
  readGiftConfig,
  persistGiftConfig,
  buildShareQuery,
  clampBlessing,
  clampSignature,
} = require('../../utils/gift')

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

  onLoad(query) {
    const gift = readGiftConfig(query)
    this.setData({
      blessing: gift.blessing,
      signature: gift.signature,
      selectedBox: gift.box,
      blessCount: [...gift.blessing].length,
      sigCount: [...gift.signature].length,
    })
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  onBlessingInput(e) {
    const blessing = clampBlessing(e.detail.value)
    this.setData({
      blessing,
      blessCount: [...blessing].length,
    })
  },

  onSignatureInput(e) {
    const signature = clampSignature(e.detail.value)
    this.setData({
      signature,
      sigCount: [...signature].length,
    })
  },

  onPickBox(e) {
    this.setData({ selectedBox: e.currentTarget.dataset.box })
  },

  _currentConfig() {
    return {
      blessing: this.data.blessing || DEFAULT_GIFT.blessing,
      signature: this.data.signature,
      box: this.data.selectedBox,
    }
  },

  onSave() {
    const config = persistGiftConfig(this._currentConfig())
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/stage/stage?${buildShareQuery(config)}`,
      })
    }, 400)
  },

  onSharePreview() {
    const config = persistGiftConfig(this._currentConfig())
    this.setData({ shareQuery: buildShareQuery(config) })
  },

  onCopyQuery() {
    const text = `pages/stage/stage?${this.data.shareQuery}`
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },
})
