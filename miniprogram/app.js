var config = require('./utils/config.js')

App({
  globalData: {
    gift: null,
    features: config.FEATURES
  },

  onLaunch: function () {
    try {
      var saved = wx.getStorageSync('snow-night-gift')
      if (saved) {
        this.globalData.gift =
          typeof saved === 'string' ? JSON.parse(saved) : saved
      }
    } catch (e) {
      // ignore
    }
  }
})
