# 一口 / 见景有味

从一张照片，寻找一道味道。

这是一个零依赖的手机优先 MVP，包含：

- 相册选择、拍照与桌面拖放上传
- 浏览器本地图片分析（平均色相、明度、饱和度与对比度）
- 带合理随机性的基础食物匹配
- 动态生成的统一编辑插画
- 味觉描述与 Web Share / 复制分享
- 独立 JSON 食物数据层

## 本地运行

浏览器的 `fetch` 需要通过本地静态服务器访问：

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

## 替换完整食物库

把完整数据放入 `data/foods.json`。当前前端额外使用两个可选字段：

- `palette`: 三个十六进制颜色，作为结果插画配色
- `form`: `glass`、`cup`、`bowl` 或 `plate`

若后续改用已有食物图片，可增加 `image_url` 字段，并在 `renderResult` 中优先使用它。

## 数据资产

`data/foods-clean.json` 是已清洗、已关联图片的完整数据库，共 406 条记录。开发时以该文件为数据主档。

- `data/taxonomy.json`：字段定义、允许值与受控标签表
- `data/foods.schema.json`：JSON Schema 约束
- `asset-audit/FIELD_CLEANING_REPORT.md`：清洗结果与确定性语义修正
- `asset-audit/field-changes.json`：逐字段变更记录
- `lib/matcher.mjs`：支持可见水果、食材优先的基础排序器
- `docs/MATCHING_LOGIC.md`：图片理解输入与匹配权重说明

`data/foods-full.json` 保留清洗前的完整数据与图片对应关系，用于追溯。`data/foods.json` 仍是当前 MVP 原型使用的少量示例数据。
