// Local T001 visual test: keep the other test assets and production library untouched.
const TEST_FOOD_CODE = 'T001';
const foods = require('../../data/foods-test.js')
  .filter(food => food.food_code === TEST_FOOD_CODE);
const { rankFoods, selectRecommendation } = require('../../lib/matcher.js');
const { fallbackProfile, profileFromPixels, visualReading } = require('../../lib/image-profile.js');
const { buildMaskedFood } = require('../../lib/food-compositor.js');

Page({
  data: {
    stage: 'upload',
    photoPath: '',
    photoOrientation: 'landscape',
    photoFrameStyle: '',
    foodOrientation: 'landscape',
    tearStyle: 'natural',
    croppedFoodPath: '',
    maskedFoodPath: '',
    tornEdgePath: '',
    foodDisplayPath: '',
    foodImageFailed: false,
    dateLabel: '',
    tone: 'blue',
    tones: [
      { id: 'blue', name: '雾蓝' },
      { id: 'sage', name: '浅绿' },
      { id: 'rose', name: '淡粉' },
      { id: 'sand', name: '暖沙' }
    ],
    progress: 0,
    analysisLabel: '正在观察光线',
    resultFood: {},
    visualReading: '',
    tasteLine: '',
    tearDots: Array.from({ length: 18 }, (_, index) => index)
  },

  onLoad() {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now = new Date();
    this.setData({ dateLabel: `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}` });
  },

  selectTone(event) {
    this.setData({ tone: event.currentTarget.dataset.tone });
  },

  selectTearStyle(event) {
    this.setData({ tearStyle: event.currentTarget.dataset.style, foodImageFailed: false });
  },

  resolveImageSource(src) {
    return Promise.resolve(src || '');
  },

  handleFoodImageError(event) {
    console.error('食物图片加载失败', event && event.detail);
    this.setData({ foodImageFailed: true });
  },

  getPhotoLayout(width, height) {
    const imageWidth = Number(width);
    const imageHeight = Number(height);
    if (!imageWidth || !imageHeight) {
      return { photoOrientation: 'landscape', photoFrameStyle: '' };
    }
    const ratio = imageWidth / imageHeight;
    const maxWidth = 550;
    const maxHeight = 650;
    let frameWidth = maxWidth;
    let frameHeight = frameWidth / ratio;
    if (frameHeight > maxHeight) {
      frameHeight = maxHeight;
      frameWidth = frameHeight * ratio;
    }
    return {
      photoOrientation: ratio < 1 ? 'portrait' : 'landscape',
      photoFrameStyle: `width:${Math.round(frameWidth)}rpx;height:${Math.round(frameHeight)}rpx;margin:0 auto;`
    };
  },

  buildMaskedFood(food, orientation, done) {
    buildMaskedFood(this, food, orientation).then(done);
  },

  choosePhoto(event) {
    const source = event && event.currentTarget && event.currentTarget.dataset.source;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: source ? [source] : ['album', 'camera'],
      sizeType: ['compressed'],
      success: ({ tempFiles }) => {
        const selected = tempFiles[0];
        const photoPath = selected.tempFilePath;
        const beginAnalysis = (width, height) => {
          const layout = this.getPhotoLayout(width, height);
          this.setData({
            stage: 'analysis', photoPath,
            photoOrientation: layout.photoOrientation,
            photoFrameStyle: layout.photoFrameStyle,
            progress: 8,
            analysisLabel: '正在观察光线', croppedFoodPath: '', maskedFoodPath: '', tornEdgePath: '', foodDisplayPath: '',
            foodImageFailed: false
          });
          this.runAnalysis(photoPath);
        };
        wx.getImageInfo({
          src: photoPath,
          success: ({ width, height }) => beginAnalysis(width, height),
          fail: () => beginAnalysis(selected.width, selected.height)
        });
      }
    });
  },

  runAnalysis(photoPath) {
    const stages = [
      [24, '正在观察光线'], [48, '正在辨认颜色'],
      [72, '正在寻找味觉线索'], [92, '正在靠近这一味']
    ];
    stages.forEach(([progress, label], index) => {
      setTimeout(() => this.setData({ progress, analysisLabel: label }), index * 280);
    });

    this.runLocalAnalysis(photoPath);
  },

  runLocalAnalysis(photoPath) {
    const context = wx.createCanvasContext('analysisCanvas', this);
    context.drawImage(photoPath, 0, 0, 48, 48);
    context.draw(false, () => {
      setTimeout(() => {
        wx.canvasGetImageData({
          canvasId: 'analysisCanvas', x: 0, y: 0, width: 48, height: 48,
          success: ({ data }) => this.finishAnalysis(profileFromPixels(data), 'local'),
          fail: () => this.finishAnalysis(fallbackProfile(), 'local')
        }, this);
      }, 80);
    });
  },

  finishAnalysis(profile, source) {
    console.info('图片分析完成', {
      source,
      colorGroups: profile.color_groups,
      sceneType: profile.scene_type,
      confidence: profile.confidence
    });
    const recommendation = selectRecommendation(rankFoods(foods, profile));
    if (!recommendation) return;
    const food = recommendation.food;
    const foodOrientation = ['drink', 'sweet_soup'].includes(food.type) ? 'portrait' : 'landscape';
    const reading = visualReading(profile, source);
    const ending = {
      '清爽': '轻轻散开', '绵密': '慢慢融化', '松软': '柔软地落下来', '酥脆': '发出清脆的回声',
      '顺滑': '顺着光线滑过', '软糯': '留下一点温柔余韵', 'Q弹': '带着轻快的弹性'
    }[food.texture] || '在口中慢慢展开';
    setTimeout(() => {
      this.resolveImageSource(food.image)
        .then((foodDisplayPath) => {
          const drawableFood = Object.assign({}, food, { image: foodDisplayPath });
          this.buildMaskedFood(drawableFood, foodOrientation, ({ croppedFoodPath, maskedFoodPath, tornEdgePath }) => {
            this.setData({
              stage: 'result', progress: 100, resultFood: food, foodOrientation,
              foodDisplayPath,
              croppedFoodPath, maskedFoodPath, tornEdgePath,
              foodImageFailed: false,
              visualReading: reading,
              tasteLine: `像把这一刻含入口中，${food.taste}，${ending}。`
            });
          });
        })
        .catch((error) => {
          console.error('食物图片准备失败', {
            imagePath: food.image,
            error
          });
          this.setData({
            stage: 'result', progress: 100, resultFood: food, foodOrientation,
            foodDisplayPath: '', croppedFoodPath: '', maskedFoodPath: '', tornEdgePath: '',
            foodImageFailed: true,
            visualReading: reading,
            tasteLine: `像把这一刻含入口中，${food.taste}，${ending}。`
          });
        });
    }, 1180);
  },

  onShareAppMessage() {
    const food = this.data.resultFood;
    return {
      title: food.name ? `今天的照片，尝起来像${food.name}` : '这一刻，尝起来像什么？',
      path: '/packageTaste/pages/index/index'
    };
  }
});
