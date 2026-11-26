var cards = require('../../utils/cards.js')

var MAX_GRID = 8

Page({
  data: {
    keyword: '',
    banners: [],
    gridCards: [],
    emptySlots: [],
    sentList: []
  },

  onShow: function () {
    this._refresh()
  },

  _refresh: function () {
    var keyword = this.data.keyword
    var filtered = cards.filterCards(cards.CARD_TYPES, keyword)
    var empty = []
    var i
    var n = filtered.length
    if (n < MAX_GRID) {
      for (i = 0; i < MAX_GRID - n; i++) {
        empty.push(i)
      }
    }
    this.setData({
      banners: filtered,
      gridCards: filtered.slice(0, MAX_GRID),
      emptySlots: empty,
      sentList: cards.MOCK_SENT
    })
  },

  onSearch: function (e) {
    this.setData({ keyword: e.detail.value }, this._refresh)
  },

  onOpenCard: function (e) {
    var id = e.currentTarget.dataset.id
    var card = cards.findCardType(id)
    if (!card) {
      wx.showToast({ title: '贺卡不存在', icon: 'none' })
      return
    }
    if (id === 'christmas') {
      wx.navigateTo({ url: '/pages/stage/stage' })
      return
    }
    wx.showToast({ title: '即将上线', icon: 'none' })
  }
})
