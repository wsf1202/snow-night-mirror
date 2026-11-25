/**
 * 虚拟支付钩子（个人主体 · 工具类目路径）。
 *
 * - 默认由 FEATURES.virtualPayment = false 关闭
 * - 禁止在客户端存放 session_key / 支付私钥
 * - 正式接入时：后端返回 signData / paySig，客户端只调 wx.requestVirtualPayment
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestVirtualPayment.html
 */

var config = require('./config')
var FEATURES = config.FEATURES
var VIRTUAL_GOODS_STUB = config.VIRTUAL_GOODS_STUB

function isVirtualPaymentEnabled() {
  return !!FEATURES.virtualPayment
}

/**
 * 向业务后端索取签名（stub）。
 * 真实实现：wx.request → 自家 HTTPS，勿把密钥带到小程序包。
 */
function fetchPaymentSignStub(productKey) {
  var goods = VIRTUAL_GOODS_STUB[productKey]
  if (!goods) {
    return Promise.reject(new Error('未知商品: ' + productKey))
  }

  // TODO: 替换为真实后端签名接口（勿在客户端存密钥）
  return Promise.reject(
    new Error('虚拟支付未接通：请先开通小程序虚拟支付并配置后端签名服务')
  )
}

/**
 * 发起虚拟支付。feature flag 关闭时直接提示。
 * @param {string} productKey VIRTUAL_GOODS_STUB 的 key
 */
function requestVirtualPayment(productKey) {
  if (!isVirtualPaymentEnabled()) {
    return Promise.reject(
      new Error('虚拟支付已关闭（FEATURES.virtualPayment=false）')
    )
  }

  if (typeof wx.requestVirtualPayment !== 'function') {
    return Promise.reject(
      new Error('当前基础库不支持 wx.requestVirtualPayment')
    )
  }

  return fetchPaymentSignStub(productKey).then(function (signPayload) {
    return new Promise(function (resolve, reject) {
      wx.requestVirtualPayment({
        signData: signPayload.signData,
        paySig: signPayload.paySig,
        signature: signPayload.signature,
        mode: signPayload.mode || 'short_series_goods',
        success: resolve,
        fail: reject,
      })
    })
  })
}

module.exports = {
  isVirtualPaymentEnabled: isVirtualPaymentEnabled,
  fetchPaymentSignStub: fetchPaymentSignStub,
  requestVirtualPayment: requestVirtualPayment,
  VIRTUAL_GOODS_STUB: VIRTUAL_GOODS_STUB,
}
