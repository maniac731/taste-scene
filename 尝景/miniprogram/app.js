App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d5g4a7ukvedc1f195',
        traceUser: true
      });
    }
  }
})
