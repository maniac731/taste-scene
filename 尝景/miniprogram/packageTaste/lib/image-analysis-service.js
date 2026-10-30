function prepareImageData(photoPath) {
  const compress = () => new Promise((resolve) => {
    wx.compressImage({
      src: photoPath,
      quality: 42,
      compressedWidth: 640,
      compressedHeight: 640,
      success: ({ tempFilePath }) => resolve(tempFilePath),
      fail: () => resolve(photoPath)
    });
  });

  return compress().then(filePath => new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: ({ data }) => {
        if (!data || data.length > 1400000) {
          reject(new Error('IMAGE_TOO_LARGE'));
          return;
        }
        const lowerPath = String(filePath).toLowerCase();
        const mimeType = lowerPath.endsWith('.png')
          ? 'image/png'
          : lowerPath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        resolve(`data:${mimeType};base64,${data}`);
      },
      fail: reject
    });
  }));
}

function analyzeImage(photoPath) {
  if (!wx.cloud) return Promise.reject(new Error('CLOUD_UNAVAILABLE'));
  return prepareImageData(photoPath)
    .then(imageDataUrl => wx.cloud.callFunction({
      name: 'analyzeImage',
      data: { imageDataUrl }
    }))
    .then((response) => {
      const result = response && response.result;
      if (!result || !result.ok || !result.profile) {
        console.error('云函数分析返回异常', {
          result,
          requestID: response && response.requestID
        });
        const error = new Error((result && result.message) || 'AI_ANALYSIS_FAILED');
        error.code = result && result.code;
        throw error;
      }
      return result.profile;
    });
}

module.exports = { analyzeImage, prepareImageData };
