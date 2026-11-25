/** 运行开关。勿写入 AppSecret / 支付私钥。 */

var FEATURES = {
  virtualPayment: false,
  gestureRuntime: false,
  cameraFrameDebug: false
}

var VIRTUAL_GOODS = {
  unlockPremiumEffects: {
    offerId: 'YOUR_OFFER_ID',
    productId: 'snow_premium_effects',
    label: '解锁进阶特效包'
  }
}

module.exports = {
  FEATURES: FEATURES,
  VIRTUAL_GOODS: VIRTUAL_GOODS
}
