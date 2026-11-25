const { isVirtualPaymentEnabled, requestVirtualPayment } = require('../../utils/payment')

Page({
  data: {
    snowflakes: [],
    showPayHint: true,
  },

  onLoad() {
    const snowflakes = []
    for (let i = 0; i < 18; i++) {
      snowflakes.push({
        id: i,
        left: Math.random() * 100,
        dur: 8 + Math.random() * 14,
        delay: -Math.random() * 12,
        opacity: 0.25 + Math.random() * 0.45,
        size: 4 + Math.random() * 8,
      })
    }
    this.setData({ snowflakes })
  },

  onStartCamera() {
    wx.navigateTo({ url: '/pages/stage/stage' })
  },

  onCustomize() {
    wx.navigateTo({ url: '/pages/customize/customize' })
  },

  onTryPay() {
    if (!isVirtualPaymentEnabled()) {
      wx.showModal({
        title: '虚拟支付未开通',
        content:
          '个人主体需先完成小程序注册（建议工具类目），再开通虚拟支付。客户端已预留 wx.requestVirtualPayment 钩子，FEATURES.virtualPayment 当前为 false。',
        showCancel: false,
        confirmText: '知道了',
      })
      return
    }

    requestVirtualPayment('unlockPremiumEffects')
      .then(() => {
        wx.showToast({ title: '支付成功', icon: 'success' })
      })
      .catch((err) => {
        wx.showToast({
          title: (err && err.message) || '支付未完成',
          icon: 'none',
        })
      })
  },
})
