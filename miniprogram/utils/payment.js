/**
 * 虚拟支付钩子（个人主体 · 工具类目路径）。
 *
 * - 默认由 FEATURES.virtualPayment = false 关闭
 * - 禁止在客户端存放 session_key / 支付私钥
 * - 正式接入时：后端返回 signData / paySig，客户端只调 wx.requestVirtualPayment
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestVirtualPayment.html
 */

const { FEATURES, VIRTUAL_GOODS_STUB } = require('./config')

function isVirtualPaymentEnabled() {
  return !!FEATURES.virtualPayment
}

/**
 * 向业务后端索取签名（stub）。
 * 真实实现：wx.request → 自家 HTTPS，勿把密钥带到小程序包。
 */
function fetchPaymentSignStub(productKey) {
  const goods = VIRTUAL_GOODS_STUB[productKey]
  if (!goods) {
    return Promise.reject(new Error(`未知商品: ${productKey}`))
  }

  // TODO: 替换为真实后端
  // return new Promise((resolve, reject) => {
  //   wx.request({
  //     url: 'https://YOUR_API/virtual-pay/sign',
  //     method: 'POST',
  //     data: { productId: goods.productId },
  //     success: (res) => resolve(res.data),
  //     fail: reject,
  //   })
  // })

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

  return fetchPaymentSignStub(productKey).then((signPayload) => {
    return new Promise((resolve, reject) => {
      // signPayload 应由后端提供；以下字段名以官方文档为准，勿硬编码密钥
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
  isVirtualPaymentEnabled,
  fetchPaymentSignStub,
  requestVirtualPayment,
  VIRTUAL_GOODS_STUB,
}
