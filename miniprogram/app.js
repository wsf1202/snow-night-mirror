var config = require('./utils/config')
var FEATURES = config.FEATURES

App({
  globalData: {
    gift: null,
    features: FEATURES,
  },

  onLaunch: function () {
    try {
      var saved = wx.getStorageSync('snow-night-gift')
      if (saved) {
        this.globalData.gift = typeof saved === 'string' ? JSON.parse(saved) : saved
      }
    } catch (e) {
      // ignore corrupt storage
    }
  },
})
