var payment = require('../../utils/payment.js')

Page({
  data: {},

  onStart: function () {
    wx.navigateTo({ url: '/pages/stage/stage' })
  },

  onCustomize: function () {
    wx.navigateTo({ url: '/pages/customize/customize' })
  },

  onShowPayHint: function () {
    if (!payment.isVirtualPaymentEnabled()) {
      wx.showModal({
        title: '虚拟支付未开通',
        content: '个人主体需先注册小程序（建议工具类目），再开通虚拟支付。',
        showCancel: false
      })
      return
    }
    payment.requestVirtualPayment('unlockPremiumEffects').catch(function (err) {
      wx.showToast({ title: (err && err.message) || '未完成', icon: 'none' })
    })
  }
})
