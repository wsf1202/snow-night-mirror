/** 虚拟支付钩子。默认关闭；签名由后端下发。 */

var config = require('./config.js')

function isVirtualPaymentEnabled() {
  return !!config.FEATURES.virtualPayment
}

function requestVirtualPayment(productKey) {
  if (!isVirtualPaymentEnabled()) {
    return Promise.reject(new Error('虚拟支付已关闭'))
  }
  if (typeof wx.requestVirtualPayment !== 'function') {
    return Promise.reject(new Error('当前基础库不支持虚拟支付'))
  }
  var goods = config.VIRTUAL_GOODS[productKey]
  if (!goods) {
    return Promise.reject(new Error('未知商品'))
  }
  return Promise.reject(new Error('请先配置后端签名服务'))
}

module.exports = {
  isVirtualPaymentEnabled: isVirtualPaymentEnabled,
  requestVirtualPayment: requestVirtualPayment
}
