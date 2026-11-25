const { FEATURES } = require('./utils/config')

App({
  globalData: {
    gift: null,
    features: FEATURES,
  },

  onLaunch() {
    try {
      const saved = wx.getStorageSync('snow-night-gift')
      if (saved) {
        this.globalData.gift = typeof saved === 'string' ? JSON.parse(saved) : saved
      }
    } catch (e) {
      // ignore corrupt storage
    }
  },
})
