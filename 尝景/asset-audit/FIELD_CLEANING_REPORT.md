# 数据库字段清洗报告

- 记录数：406
- 字段级变更：1266
- 资产缺失：0

## 变更统计

| 字段 | 变更记录数 |
|---|---:|
| scene_affinity | 406 |
| visual_tags | 406 |
| ingredient_tags | 406 |
| color_group_2 | 26 |
| scene_type | 11 |
| texture | 6 |
| color_group_1 | 3 |
| type | 2 |

## 确定性语义修正

| food_id | 名称 | 字段 | 原值 | 新值 |
|---:|---|---|---|---|
| 12 | 缤纷水果蛋糕 | color_group_2 | "multi" | "多色" |
| 86 | 鲜果挞 | color_group_2 | "multi" | "多色" |
| 97 | 鲜果蛋糕 | color_group_2 | "multi" | "多色" |
| 113 | 鲜果阿达子泡鲁达 | color_group_2 | "multi" | "多色" |
| 124 | 阿达子水果糖水 | color_group_2 | "multi" | "多色" |
| 148 | 仙草水果捞 | color_group_2 | "multi" | "多色" |
| 150 | 杂果西米露 | color_group_2 | "multi" | "多色" |
| 158 | 泡菜牛肉松饼 | color_group_2 | "棕" | "红" |
| 166 | 鲜果松饼 | color_group_2 | "multi" | "多色" |
| 172 | 意面沙拉 | color_group_2 | "multi" | "多色" |
| 173 | 烤蔬菜沙拉 | color_group_2 | "multi" | "多色" |
| 183 | 泰式青咖喱海鲜饭 | texture | "鲜香" | "顺滑" |
| 184 | 泰式红咖喱鸡肉饭 | texture | "咸香" | "顺滑" |
| 195 | 虾仁彩椒串 | color_group_2 | "multi" | "多色" |
| 197 | 奥尔良鸡肉彩蔬串 | color_group_2 | "multi" | "多色" |
| 202 | 彩椒牛肉串 | color_group_2 | "multi" | "多色" |
| 205 | 藤椒鸡 | scene_type | "meal" | "daily" |
| 206 | 大拌菜 | color_group_1 | "multi" | "多色" |
| 217 | 石锅拌饭 | color_group_2 | "multi" | "多色" |
| 236 | 姜母鸭 | color_group_2 | "红" | "棕" |
| 238 | 麻辣海鲜波奇碗 | scene_type | "meal" | "daily" |
| 240 | 和牛波奇碗 | scene_type | "meal" | "fresh" |
| 242 | 三文鱼牛油果杂粮饭 | scene_type | "meal" | "fresh" |
| 244 | 椰香咖喱虾饭 | texture | "鲜香" | "顺滑" |
| 257 | 奶油炖杂蔬鸡肉 | color_group_2 | "multi" | "多色" |
| 261 | 奶酪时蔬沙拉 | color_group_2 | "multi" | "多色" |
| 270 | 松茸炖鸡 | texture | "醇厚" | "软嫩" |
| 273 | 番茄牛肉饭 | texture | "鲜香" | "软嫩" |
| 274 | 菠萝虾仁炒饭 | scene_type | "meal" | "daily" |
| 280 | 五彩芋圆糖水 | color_group_1 | "multi" | "多色" |
| 290 | 什锦杂蔬汤 | color_group_1 | "multi" | "多色" |
| 305 | 鲜果巧克力吐司 | color_group_2 | "multi" | "多色" |
| 315 | 鹰嘴豆泥配烤时蔬 | color_group_2 | "multi" | "多色" |
| 316 | 香菇炖鸡 | texture | "醇厚" | "软嫩" |
| 320 | 芋泥多彩酸奶碗 | color_group_2 | "multi" | "多色" |
| 330 | 卤煮火烧 | color_group_2 | "红" | "棕" |
| 344 | 豆沙小丸子 | scene_type | "dessert" | "relaxed" |
| 345 | 彩椒炒芥兰 | color_group_2 | "multi" | "多色" |
| 354 | 木耳炒肉片 | color_group_2 | "红" | "棕" |
| 357 | 红糖糍粑 | type | "sweet_soup" | "snack" |
| 357 | 红糖糍粑 | scene_type | "snack" | "comfort" |
| 358 | 梅干菜烧肉 | color_group_2 | "红" | "棕" |
| 360 | 卤味双拼 | scene_type | "meal" | "social" |
| 360 | 卤味双拼 | color_group_2 | "红" | "棕" |
| 375 | 玉米炒青豆 | scene_type | "meal" | "daily" |
| 387 | 鸡蛋羹 | type | "sweet_soup" | "light_meal" |
| 395 | 水煮牛肉 | scene_type | "meal" | "social" |
| 396 | 酒酿圆子 | scene_type | "dessert" | "comfort" |

## 清洗后值域

- `type`：meal（116）、dessert（60）、drink（52）、light_meal（50）、soup（40）、bakery（37）、sweet_soup（33）、snack（18）
- `intensity`：平衡（231）、浓郁（109）、轻盈（66）
- `taste`：咸香（120）、清甜（82）、鲜香（51）、酸甜（45）、甘香（33）、辛香（29）、苦甜（16）、椰香（14）、醇厚（11）、茶香（4）、咸甜（1）
- `temperature`：温热（171）、微凉（84）、滚烫（62）、常温（56）、冰爽（33）
- `texture`：顺滑（72）、绵密（67）、软糯（60）、Q弹（57）、流动（36）、松软（34）、酥脆（30）、清爽（27）、脆嫩（17）、软嫩（3）、滑嫩（1）、颗粒分明（1）、脆爽（1）
- `season`：all（237）、summer（112）、winter（57）
- `scene_type`：fresh（101）、comfort（92）、daily（91）、celebration（59）、relaxed（39）、social（24）

## 保留策略

- 原始 `visual_tags` 保存在 `source_visual_tags`。
- 原始 `scene_affinity` 保存在 `source_scene_affinity`。
- 原始数据和图片文件未修改。
- 每条记录继续保留已复核的 `asset` 对应关系。
