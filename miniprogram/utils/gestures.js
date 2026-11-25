/**
 * 手势识别 stub。
 *
 * TODO(v2): 在微信小程序运行时接入手势方案。可选路径：
 * 1. 自研轻量关键点模型（ONNX / 微信 AI 能力 / 云端推理 — 注意隐私「本地处理」承诺）
 * 2. 评估 MediaPipe 在小程序 Worker / WebAssembly 的可行性（多数机型受限）
 * 3. 短期：手动「练习下一步」按钮代替 OK 手势
 *
 * 接口刻意对齐 web `GestureDetector.update` 的输出形状，方便日后替换实现。
 */

const { FEATURES } = require('./config')

function createGestureStub() {
  return {
    enabled: FEATURES.gestureRuntime,
    lastReason: FEATURES.gestureRuntime
      ? 'runtime-ready-placeholder'
      : 'stubbed-pending-runtime',

    /**
     * @param {object} _frame — camera frame / landmark payload（v1 忽略）
     * @returns {{ events: string[], anchors: object }}
     */
    update(_frame) {
      // TODO: 解析 landmarks → a1/a3/a7/a6/b8/a2/next
      return { events: [], anchors: {} }
    },

    /** 开发期：手动注入一个事件，便于联调特效管线 */
    debugEmit(eventId) {
      return { events: [eventId], anchors: {} }
    },
  }
}

module.exports = {
  createGestureStub,
}
