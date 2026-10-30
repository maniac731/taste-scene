# 尝景微信小程序原型

这是从现有网页原型迁移出的原生微信小程序版本，完成以下闭环：

1. 从相册或相机选择照片；
2. 当前测试模式在设备端分析平均颜色、亮度和饱和度；
3. 将标准化图片画像与食物数据进行匹配；
4. 以“透明透卡 + 撕纸食物卡”的形式展示结果；
5. 支持重新选择与微信分享。

## 打开方式

用微信开发者工具导入本目录：

`尝景/miniprogram`

当前 `project.config.json` 使用 `touristappid`，适合本地预览。需要真机调试、上传或发布时，再换成正式小程序 AppID。

## 临时图片边界

`assets/foods-temp` 中 405 张图片由 `asset-audit/contact-sheets` 自动裁切，仅用于原型布局与交互验证；分辨率不足，不是发布资产。另 1 张补生成图片来自项目内现有高清文件。

重新生成临时资产和小程序数据：

```bash
python3 scripts/build_miniprogram_assets.py
```

未来拿到原始高清图片后，应输出统一尺寸的 WebP，并保持 `/assets/foods-temp/F001.webp` 这类路径或同步更新 `data/foods.js`。

## 当前识别边界

当前页面暂停调用 `cloudfunctions/analyzeImage`，只运行设备端颜色分析。云函数代码仍保留，后续取得合适的透明底素材、恢复 AI 效果测试时可重新接入。

## T001 单图测试模式

当前结果页只从 `packageTaste/data/foods-test.js` 中启用 `T001`，对应透明底图片为
`packageTaste/assets/foods-test/T001.png`。其余 5 张测试素材、原有 `foods.js` 和 406 张
`foods-temp` 图片均未被改动，也不会进入当前候选结果。

恢复完整图库时，把 `packageTaste/pages/index/index.js` 顶部的数据引用从
`../../data/foods-test.js` 改回 `../../data/foods.js` 即可。

## 代码结构

- `packageTaste/pages/index/index.js`：页面状态和流程编排
- `packageTaste/lib/image-analysis-service.js`：图片压缩、编码和云函数调用
- `packageTaste/lib/image-profile.js`：本地像素画像和视觉描述
- `packageTaste/lib/matcher.js`：食物评分和选择
- `packageTaste/lib/food-compositor.js`：米黄色内层、透明食物和撕纸遮罩合成
- `packageTaste/data/foods.js`：自动生成的完整图库数据，不按源码模块拆分
- `packageTaste/data/foods-test.js`：独立测试图库
