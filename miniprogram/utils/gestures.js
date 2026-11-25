/** 手势 stub。TODO: 本地关键点模型；画面不上传。 */

var config = require('./config.js')

function createGestureStub() {
  return {
    enabled: config.FEATURES.gestureRuntime,
    update: function () {
      return { events: [], anchors: {} }
    },
    debugEmit: function (eventId) {
      return { events: [eventId], anchors: {} }
    }
  }
}

module.exports = {
  createGestureStub: createGestureStub
}
