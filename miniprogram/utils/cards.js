/** 贺卡类型目录与本地 mock 数据 */

var CARD_TYPES = [
  {
    id: 'christmas',
    name: '圣诞节',
    type: '节日',
    thumb: '/assets/pixel/gift.png',
    banner: '/assets/pixel/tree.png',
    desc: '像素雪夜互动镜 · 手势打开祝福'
  }
]

var MOCK_SENT = [
  {
    id: 's1',
    cardTypeId: 'christmas',
    cardName: '圣诞节',
    toName: '小雪',
    blessing: '圣诞快乐！愿你被温柔以待。',
    time: '2026-11-24 20:18'
  },
  {
    id: 's2',
    cardTypeId: 'christmas',
    cardName: '圣诞节',
    toName: '阿北',
    blessing: '平安夜快乐～',
    time: '2026-11-23 21:05'
  }
]

var MOCK_RECEIVED = [
  {
    id: 'r1',
    cardTypeId: 'christmas',
    cardName: '圣诞节',
    fromName: '林予',
    fromWx: 'linyu_wx',
    blessing: '愿你的冬天有光。',
    time: '2026-11-25 09:12',
    timeMs: 1764036720000
  },
  {
    id: 'r2',
    cardTypeId: 'christmas',
    cardName: '圣诞节',
    fromName: '周周',
    fromWx: 'zhouzhou',
    blessing: '圣诞快乐！',
    time: '2026-11-24 22:40',
    timeMs: 1763997600000
  },
  {
    id: 'r3',
    cardTypeId: 'christmas',
    cardName: '圣诞节',
    fromName: '阿北',
    fromWx: 'abei',
    blessing: '比心拆礼物～',
    time: '2026-11-22 19:01',
    timeMs: 1763814060000
  }
]

/**
 * 多类型时「收到的」页左侧瀑布筛选用。
 * 当前仅圣诞节；日后新增类型时自动出现在 leftTypes。
 */
function listTypeFilters(receivedList) {
  var map = {}
  var i
  var item
  var out = [{ id: 'all', name: '全部' }]
  for (i = 0; i < receivedList.length; i++) {
    item = receivedList[i]
    if (!map[item.cardTypeId]) {
      map[item.cardTypeId] = true
      out.push({ id: item.cardTypeId, name: item.cardName })
    }
  }
  return out
}

function findCardType(id) {
  var i
  for (i = 0; i < CARD_TYPES.length; i++) {
    if (CARD_TYPES[i].id === id) return CARD_TYPES[i]
  }
  return null
}

function filterCards(list, keyword) {
  var q = String(keyword || '').trim().toLowerCase()
  if (!q) return list.slice(0)
  var out = []
  var i
  var c
  var hay
  for (i = 0; i < list.length; i++) {
    c = list[i]
    hay = (c.name + ' ' + c.type + ' ' + (c.desc || '')).toLowerCase()
    if (hay.indexOf(q) !== -1) out.push(c)
  }
  return out
}

function filterReceived(list, opts) {
  opts = opts || {}
  var q = String(opts.keyword || '').trim().toLowerCase()
  var typeId = opts.typeId || 'all'
  var sort = opts.sort || 'time_desc'
  var out = []
  var i
  var item
  var hay
  for (i = 0; i < list.length; i++) {
    item = list[i]
    if (typeId !== 'all' && item.cardTypeId !== typeId) continue
    if (q) {
      hay = (item.fromName + ' ' + item.fromWx + ' ' + item.cardName + ' ' + item.blessing).toLowerCase()
      if (hay.indexOf(q) === -1) continue
    }
    out.push(item)
  }
  out.sort(function (a, b) {
    if (sort === 'name_asc') {
      return String(a.fromName).localeCompare(String(b.fromName), 'zh')
    }
    if (sort === 'name_desc') {
      return String(b.fromName).localeCompare(String(a.fromName), 'zh')
    }
    if (sort === 'time_asc') {
      return (a.timeMs || 0) - (b.timeMs || 0)
    }
    return (b.timeMs || 0) - (a.timeMs || 0)
  })
  return out
}

module.exports = {
  CARD_TYPES: CARD_TYPES,
  MOCK_SENT: MOCK_SENT,
  MOCK_RECEIVED: MOCK_RECEIVED,
  listTypeFilters: listTypeFilters,
  findCardType: findCardType,
  filterCards: filterCards,
  filterReceived: filterReceived
}
