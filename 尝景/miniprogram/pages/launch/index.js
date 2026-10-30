Page({
  onLoad() {
    wx.redirectTo({
      url: '/packageTaste/pages/index/index',
      fail: () => {
        this.setData({ loadFailed: true });
      }
    });
  },

  retry() {
    this.setData({ loadFailed: false });
    wx.redirectTo({
      url: '/packageTaste/pages/index/index',
      fail: () => this.setData({ loadFailed: true })
    });
  }
});
