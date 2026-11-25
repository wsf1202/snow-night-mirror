/** 指引特效元数据 */

var EFFECT_META = [
  { id: 'a1', name: '飘雪祝福', hint: '五指张开，雪从掌心洒出', guide: '/assets/pixel/guide-snow.jpg' },
  { id: 'a3', name: '圣诞铃响', hint: '拇食捏合轻摇；松手即消失', guide: '/assets/pixel/guide-bell.jpg' },
  { id: 'a7', name: '圣诞帽', hint: '伸出 1 根手指（食指）', guide: '/assets/pixel/guide-hat.jpg' },
  { id: 'a6', name: '驯鹿鹿角', hint: '伸出 2 根手指（食指+中指）', guide: '/assets/pixel/guide-antlers.jpg' },
  { id: 'b8', name: '圣诞树点灯', hint: '伸出 3 根手指，树顶发光点灯', guide: '/assets/pixel/guide-tree.jpg' },
  { id: 'a2', name: '礼物掉落', hint: '双手比心打开专属礼物', guide: '/assets/pixel/guide-gift.jpg' }
]

function findEffect(id) {
  var i
  for (i = 0; i < EFFECT_META.length; i++) {
    if (EFFECT_META[i].id === id) return EFFECT_META[i]
  }
  return null
}

module.exports = {
  EFFECT_META: EFFECT_META,
  findEffect: findEffect
}
