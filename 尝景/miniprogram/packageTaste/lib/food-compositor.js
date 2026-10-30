const REVEAL_BACKGROUND = '#eadfce';
const TORN_EDGE_COLOR = '#f4eee2';

function exportCanvas(page, canvas, width, height, pixelRatio) {
  return new Promise((resolve) => {
    wx.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: width * pixelRatio,
      height: height * pixelRatio,
      destWidth: width * 2,
      destHeight: height * 2,
      fileType: 'png',
      success: ({ tempFilePath }) => resolve(tempFilePath),
      fail: () => resolve('')
    }, page);
  });
}

function buildMaskedFood(page, food, orientation) {
  const width = orientation === 'portrait' ? 360 : 560;
  const height = orientation === 'portrait' ? 500 : 340;
  const maskPath = orientation === 'portrait'
    ? '/assets/masks/torn-natural-portrait-v1.png'
    : '/assets/masks/torn-natural-landscape-v1.png';

  return new Promise((resolve) => {
    wx.createSelectorQuery().in(page).select('#maskCanvas').fields({ node: true, size: true }).exec((result) => {
      const canvas = result && result[0] && result[0].node;
      if (!canvas) {
        resolve({ croppedFoodPath: '', maskedFoodPath: '', tornEdgePath: '' });
        return;
      }

      const pixelRatio = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio)
        || wx.getSystemInfoSync().pixelRatio || 2;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const context = canvas.getContext('2d');
      context.scale(pixelRatio, pixelRatio);

      const loadImage = (src) => new Promise((imageResolve, reject) => {
        const image = canvas.createImage();
        image.onload = () => imageResolve(image);
        image.onerror = reject;
        image.src = src;
      });

      Promise.all([loadImage(food.image), loadImage(maskPath)])
        .then(async ([foodImage, maskImage]) => {
          const imageWidth = foodImage.width || width;
          const imageHeight = foodImage.height || height;
          const scale = Math.max(width / imageWidth, height / imageHeight);
          const sourceWidth = width / scale;
          const sourceHeight = height / scale;
          const sourceX = (imageWidth - sourceWidth) / 2;
          const sourceY = (imageHeight - sourceHeight) / 2;

          context.clearRect(0, 0, width, height);
          context.fillStyle = REVEAL_BACKGROUND;
          context.fillRect(0, 0, width, height);
          context.drawImage(foodImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
          const croppedFoodPath = await exportCanvas(page, canvas, width, height, pixelRatio);

          context.globalCompositeOperation = 'destination-in';
          context.drawImage(maskImage, 0, 0, width, height);
          context.globalCompositeOperation = 'source-over';
          const maskedFoodPath = await exportCanvas(page, canvas, width, height, pixelRatio);

          const edgeInset = orientation === 'portrait' ? 12 : 10;
          context.clearRect(0, 0, width, height);
          context.drawImage(maskImage, 0, 0, width, height);
          context.globalCompositeOperation = 'source-in';
          context.fillStyle = TORN_EDGE_COLOR;
          context.fillRect(0, 0, width, height);
          context.globalCompositeOperation = 'destination-out';
          context.drawImage(maskImage, edgeInset, edgeInset, width - edgeInset * 2, height - edgeInset * 2);
          context.globalCompositeOperation = 'source-over';
          const tornEdgePath = await exportCanvas(page, canvas, width, height, pixelRatio);

          resolve({ croppedFoodPath, maskedFoodPath, tornEdgePath });
        })
        .catch((error) => {
          console.error('食物图片合成失败', error);
          resolve({ croppedFoodPath: '', maskedFoodPath: '', tornEdgePath: '' });
        });
    });
  });
}

module.exports = { buildMaskedFood };
