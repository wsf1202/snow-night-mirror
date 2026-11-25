var cards = require('../../utils/cards.js')

Page({
  data: {
    keyword: '',
    sort: 'time_desc',
    activeType: 'all',
    typeFilters: [],
    showTypeRail: false,
    list: []
  },

  onShow: function () {
    this._refresh()
  },

  _refresh: function () {
    var all = cards.MOCK_RECEIVED
    var filters = cards.listTypeFilters(all)
    // 除「全部」外若超过 1 种类型，显示左侧瀑布
    var showRail = filters.length > 2
    var list = cards.filterReceived(all, {
      keyword: this.data.keyword,
      typeId: this.data.activeType,
      sort: this.data.sort
    })
    this.setData({
      typeFilters: filters,
      showTypeRail: showRail,
      list: list
    })
  },

  onSearch: function (e) {
    this.setData({ keyword: e.detail.value }, this._refresh)
  },

  onSort: function (e) {
    this.setData({ sort: e.currentTarget.dataset.sort }, this._refresh)
  },

  onType: function (e) {
    this.setData({ activeType: e.currentTarget.dataset.id }, this._refresh)
  },

  onOpen: function (e) {
    var id = e.currentTarget.dataset.id
    var i
    var item = null
    for (i = 0; i < cards.MOCK_RECEIVED.length; i++) {
      if (cards.MOCK_RECEIVED[i].id === id) {
        item = cards.MOCK_RECEIVED[i]
        break
      }
    }
    if (!item) return
    if (item.cardTypeId === 'christmas') {
      wx.navigateTo({ url: '/pages/stage/stage' })
      return
    }
    wx.showToast({ title: '暂不支持该类型', icon: 'none' })
  }
})
