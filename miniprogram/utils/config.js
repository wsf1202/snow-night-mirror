/**
 * 运行时开关与占位配置。
 * 切勿在此硬编码 AppSecret / 支付密钥 / 商户号密钥。
 * 真实支付参数应由后端签发（signData），客户端只消费一次性签名。
 */

const FEATURES = {
  /** 虚拟支付入口；无 AppID / 未开通前保持 false */
  virtualPayment: false,
  /** 手势识别：v1 为 stub；真机 MediaPipe/自研模型就绪后打开 */
  gestureRuntime: false,
  /** 相机帧回调调试 toast */
  cameraFrameDebug: false,
}

/** 占位 AppID — 用微信开发者工具替换 project.config.json 的 appid */
const PLACEHOLDER_APPID = 'touristappid'

/**
 * 虚拟支付商品占位（仅本地 UI；真实 goods 由后台配置）
 * @see https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestVirtualPayment.html
 */
const VIRTUAL_GOODS_STUB = {
  unlockPremiumEffects: {
    offerId: 'YOUR_OFFER_ID',
    productId: 'snow_premium_effects',
    label: '解锁进阶特效包',
    priceFen: 1,
  },
}

module.exports = {
  FEATURES,
  PLACEHOLDER_APPID,
  VIRTUAL_GOODS_STUB,
}
