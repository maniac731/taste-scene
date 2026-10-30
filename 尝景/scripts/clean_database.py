from pathlib import Path
from collections import Counter
import json


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/foods-full.json'
OUTPUT = ROOT / 'data/foods-clean.json'
TAXONOMY = ROOT / 'data/taxonomy.json'
AUDIT = ROOT / 'asset-audit'

ALLOWED = {
    'type': ['drink', 'dessert', 'meal', 'light_meal', 'snack', 'bakery', 'soup', 'sweet_soup'],
    'color_group': ['红', '橙', '黄', '绿', '蓝', '紫', '粉', '棕', '黑', '白', '多色'],
    'intensity': ['轻盈', '平衡', '浓郁'],
    'taste': ['清甜', '酸甜', '咸甜', '咸香', '鲜香', '苦甜', '辛香', '甘香', '椰香', '茶香', '醇厚'],
    'temperature': ['冰爽', '微凉', '常温', '温热', '滚烫'],
    'texture': ['清爽', '流动', '顺滑', '绵密', '松软', '酥脆', '软糯', 'Q弹', '脆嫩', '脆爽', '滑嫩', '软嫩', '颗粒分明'],
    'season': ['spring', 'summer', 'autumn', 'winter', 'all'],
    'scene_type': ['fresh', 'comfort', 'relaxed', 'daily', 'celebration', 'social'],
}

# Name-based associations only: these are not image-verified ingredients.
INGREDIENT_RULES = [
    ('水果', ['水果', '鲜果', '杂果']), ('无花果', ['无花果']), ('蓝莓', ['蓝莓']), ('草莓', ['草莓']), ('莓果', ['莓果', '桑果', '莓云', '莓芒']),
    ('桃', ['蜜桃', '白桃', '桃莓', '桃气']), ('苹果', ['苹果', '华尔道夫']), ('橙', ['香橙', '橙柚', '橙C', '橙香', '橘子']),
    ('柚子', ['西柚', '柚子', '柚冷萃', '杨枝甘露']), ('梨', ['雪梨', '梨']), ('芒果', ['芒果', '杨枝甘露']), ('菠萝', ['菠萝']),
    ('火龙果', ['火龙果']), ('奇异果', ['奇异果']), ('木瓜', ['木瓜']), ('柿子', ['柿子']), ('芭乐', ['芭乐']),
    ('西瓜', ['西瓜']), ('葡萄', ['青提', '葡萄']), ('香蕉', ['香蕉']), ('石榴', ['石榴']),
    ('荔枝', ['荔枝']), ('百香果', ['百香果']), ('牛油果', ['牛油果']), ('柠檬', ['柠檬', '青柠', '柠香']),
    ('椰子', ['椰子', '椰奶', '椰汁', '椰乳', '椰香', '蓝椰', '海底椰']), ('红枣', ['红枣']), ('桂圆', ['桂圆']),
    ('山楂', ['山楂']), ('油柑', ['油柑']), ('板栗', ['板栗', '栗子']),
    ('红豆', ['红豆', '豆沙']), ('绿豆', ['绿豆']), ('黄豆', ['黄豆']), ('青豆', ['青豆']),
    ('花生', ['花生']), ('芝麻', ['芝麻']), ('开心果', ['开心果']), ('核桃', ['核桃']), ('松仁', ['松仁']),
    ('莲子', ['莲子']), ('百合', ['百合']), ('芋头', ['芋泥', '芋圆', '香芋']), ('紫薯', ['紫薯']),
    ('红薯', ['红薯']), ('山药', ['山药']), ('南瓜', ['南瓜']), ('玉米', ['玉米']),
    ('木薯', ['木薯']), ('桃胶', ['桃胶']), ('麻薯', ['麻薯']), ('酒酿', ['酒酿']), ('斑斓', ['斑斓']),
    ('阿达子', ['阿达子']), ('银耳', ['银耳']), ('仙草', ['仙草']),
    ('三文鱼', ['三文鱼']), ('金枪鱼', ['金枪鱼']), ('鳗鱼', ['鳗鱼']), ('鱼籽', ['鱼籽']), ('鳕鱼', ['鳕鱼']), ('鲈鱼', ['鲈鱼']),
    ('黄鱼', ['黄鱼']), ('鲫鱼', ['鲫鱼']), ('鱼', ['水煮鱼']), ('虾', ['虾', '天妇罗']), ('蟹', ['蟹', '蟹柳']), ('鱿鱼', ['鱿鱼']),
    ('蛤蜊', ['蛤蜊']), ('鲍鱼', ['鲍鱼']), ('龙虾', ['龙虾']), ('海鲜', ['海鲜']),
    ('肉类', ['烤肉', '卤味', '夫妻肺片']), ('牛肉', ['牛肉', '牛柳', '牛排', '牛腩', '肥牛', '和牛', '寿喜烧']),
    ('猪肉', ['猪肉', '猪扒', '猪颈肉', '排骨', '叉烧', '肉末', '肉沫', '肉丝', '烧肉', '肉饼', '酱肘子', '卤肉', '卤煮', '瘦肉', '猪骨', '猪肚']),
    ('鸡肉', ['鸡肉', '鸡腿', '鸡翅', '乌鸡', '滑鸡', '黄焖鸡', '咖喱鸡', '藤椒鸡', '炖鸡', '焖鸡', '烧鸡', '烤鸡', '猪肚鸡', '毛桃鸡', '参鸡', '豉油鸡', '鸡胗']),
    ('鸭肉', ['鸭腿', '姜母鸭', '烤鸭']), ('羊肉', ['羊肉']), ('火腿', ['火腿']), ('培根', ['培根']), ('香肠', ['香肠', '部队锅']),
    ('鸡蛋', ['鸡蛋', '炒蛋', '滑蛋', '煎蛋', '水波蛋', '班尼迪克', '北非蛋', '卤蛋', '蛋包饭', '烘蛋', '蛋花汤', '鸡蛋羹']),
    ('豆腐', ['豆腐', '豆花', '大酱汤', '酸辣汤']), ('豆乳', ['豆乳']), ('番茄', ['番茄', '圣女果', '小番茄']), ('蘑菇', ['蘑菇', '菌菇', '香菇', '松茸', '口蘑', '茶树菇']),
    ('菠菜', ['菠菜']), ('青菜', ['青菜']), ('芥兰', ['芥兰']), ('菜花', ['菜花']), ('娃娃菜', ['娃娃菜']),
    ('西洋菜', ['西洋菜']), ('苦瓜', ['苦瓜']), ('冬瓜', ['冬瓜']), ('青瓜', ['青瓜', '黄瓜']),
    ('胡萝卜', ['胡萝卜']), ('白萝卜', ['白萝卜']), ('土豆', ['土豆']), ('茄子', ['茄子']),
    ('彩椒', ['彩椒', '青椒', '红椒']), ('芹菜', ['芹菜']), ('莴笋', ['莴笋']), ('芦笋', ['芦笋']),
    ('秋葵', ['秋葵']), ('韭黄', ['韭黄']), ('蒜苔', ['蒜苔']), ('木耳', ['木耳']), ('紫甘蓝', ['紫甘蓝']),
    ('蔬菜', ['蔬菜', '杂蔬', '时蔬', '烤蔬菜', '罗汉斋', '希腊沙拉', '凯撒沙拉', '大拌菜', '翠玉红珠沙拉', '双色星云沙拉']),
    ('紫苏', ['紫苏']), ('鹰嘴豆', ['鹰嘴豆']), ('皮蛋', ['皮蛋']),
    ('海带', ['海带', '昆布']), ('紫菜', ['紫菜', '海苔']), ('薄荷', ['薄荷']), ('抹茶', ['抹茶']),
    ('桂花', ['桂花']), ('玫瑰', ['玫瑰']), ('菊花', ['菊花']), ('茉莉', ['茉莉']), ('蝶豆花', ['蝶豆']),
    ('面包', ['吐司', '贝果', '开放三明治']), ('米饭', ['米饭', '炒饭', '焗饭', '杂粮饭', '煲仔饭', '烩饭', '焖饭', '拌饭']),
    ('面条', ['意面', '墨鱼面', '炸酱面', '海鲜面', '汤粉', '牛河', '炒河粉']), ('饺子', ['饺']), ('年糕', ['年糕']),
    ('巧克力', ['巧克力', '可可', '歌剧院蛋糕']), ('咖啡', ['美式', '冷萃', '咖啡', '歌剧院蛋糕']), ('茶', ['茶', '乌龙', '四季春']),
    ('牛奶', ['牛乳', '鲜奶', '燕麦奶', '奶茶', '奶油']), ('芝士', ['芝士', '奶酪', '布拉塔']),
    ('酸奶', ['酸奶']), ('蜂蜜', ['蜂蜜']), ('焦糖', ['焦糖']), ('海盐', ['海盐']), ('糯米', ['糯米', '糍粑']),
]

# Keep recipe assumptions out of the name index. Empty tags are valid.
REMOVE_NAME_HINTS = {
    '苹果': ['华尔道夫'], '柚子': ['杨枝甘露'], '芒果': ['杨枝甘露'],
    '椰子': ['海底椰'], '虾': ['天妇罗'], '蟹': ['蟹柳'],
    '牛肉': ['寿喜烧'], '猪肉': ['肉末', '肉沫', '肉丝', '烧肉', '肉饼', '卤煮'],
    '香肠': ['部队锅'], '豆腐': ['大酱汤', '酸辣汤'],
    '蔬菜': ['罗汉斋', '希腊沙拉', '凯撒沙拉', '大拌菜', '翠玉红珠沙拉', '双色星云沙拉'],
    '巧克力': ['歌剧院蛋糕'], '咖啡': ['歌剧院蛋糕'],
    '牛奶': ['燕麦奶', '奶茶', '奶油'],
}
INGREDIENT_RULES = [
    (canonical, [alias for alias in aliases if alias not in REMOVE_NAME_HINTS.get(canonical, [])])
    for canonical, aliases in INGREDIENT_RULES
] + [
    ('燕麦', ['燕麦']), ('蟹柳', ['蟹柳']), ('海底椰', ['海底椰']),
    ('肉末', ['肉末', '肉沫']), ('肉丝', ['肉丝']), ('奶油', ['奶油']),
]

# Detection aliases describe objects, not dish names or recipe implications.
DETECTION_ALIASES = {
    '凤梨': '菠萝', '猕猴桃': '奇异果', '圣女果': '番茄', '西红柿': '番茄',
    '黄瓜': '青瓜', '马铃薯': '土豆', '牛油果': '牛油果',
    '青提': '葡萄', '蜜桃': '桃', '白桃': '桃', '雪梨': '梨',
    '虾仁': '虾', '鸡卵': '鸡蛋', '奶酪': '芝士', '肉沫': '肉末',
}

TYPE_FIXES = {
    357: 'snack',       # 红糖糍粑不是糖水
    387: 'light_meal',  # 鸡蛋羹是咸味蒸蛋类轻食
}

TEXTURE_FIXES = {
    183: '顺滑', 184: '顺滑', 244: '顺滑',  # 咖喱酱体口感
    270: '软嫩', 273: '软嫩', 316: '软嫩',  # 炖鸡/牛肉主体口感
}

SCENE_TYPE_FIXES = {
    205: 'daily', 238: 'daily', 240: 'fresh', 242: 'fresh', 274: 'daily',
    344: 'relaxed', 357: 'comfort', 360: 'social', 375: 'daily',
    395: 'social', 396: 'comfort',
}

# Only descriptors that can be defended from the rendered food image are retained.
VISUAL_NORMALIZATION = {
    '通透': '透明感', '鲜亮': '高明度', '柔和': '低对比', '丰富': '元素丰富',
    '层次': '层次分明', '明亮': '高明度', '多彩': '多色组合', '拉丝': '拉丝形态',
    '粉嫩': '粉润色泽', '流动': '流动形态', '蓬松': '蓬松体积', '油润': '油润光泽',
    '极简': '简洁构图', '冰感': '冰晶感', '红油': '红油光泽', '多汁': '汁液感',
    '流心': '流心切面', '暗沉': '低明度', '暖调': '暖色调', '小巧': '小体量',
    '奶白': '奶白色泽', '颗粒分明': '颗粒可见', '水润': '水润光泽', '沙感': '细沙质感',
    '黏滑': '黏稠流动', '沙糯': '粉沙质感', '暗黑': '深色主体', '丰盛': '高填充构图',
    '清新': '清浅配色', '轻盈': '轻透留白', '浓郁': '饱和厚重', '温暖': '暖色调',
    '清爽': '清透感', '精致': '规整摆盘', '家常': '朴素摆盘', '复古': '暖调低饱和',
    '自然': '自然配色', '活力': '高饱和撞色', '朴素': '简洁摆盘', '热烈': '高饱和暖色',
}

SCENE_RULES = [
    ('春日', ('春日', '春味')),
    ('夏日', ('夏日', '夏夜', '解暑', '海边')),
    ('秋日', ('秋日',)),
    ('冬日', ('冬日', '冬夜', '暖身', '取暖', '暖手')),
    ('雨天', ('雨天', '雨夜')),
    ('居家', ('居家', '家常', '家宴')),
    ('户外', ('户外', '庭院')),
    ('海边', ('海边',)),
    ('旅行', ('旅行', '度假')),
    ('通勤', ('通勤', '工作日早咖')),
    ('野餐', ('野餐',)),
    ('散步', ('散步', '逛街')),
    ('运动', ('运动', '健身')),
    ('咖啡馆', ('咖啡馆',)),
    ('窗边', ('窗边',)),
    ('街头', ('街头', '夜市', '市井')),
    ('早餐', ('早餐', '早茶')),
    ('早午餐', ('早午餐', 'brunch')),
    ('午餐', ('午餐', '便当')),
    ('下午茶', ('下午茶', '茶会')),
    ('晚餐', ('晚餐', '晚饭', '晚宴')),
    ('夜宵', ('夜宵', '夜晚小食')),
    ('独处', ('独处', '小憩', '放松')),
    ('朋友聚会', ('朋友', '闺蜜', '小聚', '聚餐', '聚会', '分享', '围炉', '餐会')),
    ('家庭聚会', ('家人', '团聚', '团圆', '家宴')),
    ('约会', ('约会',)),
    ('节日', ('节日', '圣诞', '万圣', '元宵')),
    ('生日', ('生日',)),
    ('派对', ('派对', '音乐节')),
    ('读书', ('读书',)),
    ('追剧', ('追剧',)),
    ('日常', ('工作日', '便饭', '便餐', '快餐', '快手')),
    ('下酒', ('下酒', '居酒')),
]

SCENE_FALLBACK = {
    'fresh': ['户外'], 'comfort': ['居家'], 'relaxed': ['独处'],
    'daily': ['日常'], 'celebration': ['节日'], 'social': ['朋友聚会'],
}

FIELD_DEFINITIONS = {
    'food_id': '稳定的数字主键，不因名称调整而改变。',
    'name': '面向用户展示的食物名称。',
    'type': '食物基础类别。',
    'color_1/color_2': '食物主体与辅助视觉颜色。',
    'color_group_1/color_group_2': '颜色的受控大类，用于粗粒度匹配。',
    'intensity': '整体视觉与味觉存在感。',
    'taste': '主导味觉或风味方向。',
    'temperature': '食用温度联想。',
    'texture': '入口后的主要口感。',
    'season': '最强季节联想；all 表示全年。',
    'scene_type': '食物带来的氛围，不表示食物类别。',
    'visual_tags': '可从图片观察或计算的颜色、构图、光泽与形态标签。',
    'scene_affinity': '受控生活场景标签，用于照片场景匹配。',
    'ingredient_tags': '从食物名称提取的食材或食物形态关联；不代表图片中可见，也不是完整配料表。允许为空。',
    'source_visual_tags/source_scene_affinity': '原始标签，仅用于追溯。',
    'asset': '经过复核的唯一图片资产及完整性信息。',
}


def add_change(changes, food, field, before, after, reason):
    if before == after:
        return
    changes.append({
        'food_id': food['food_id'], 'name': food['name'], 'field': field,
        'before': before, 'after': after, 'reason': reason,
    })


def normalize_scene_affinity(source, scene_type, season):
    text = ' '.join(source)
    tags = []
    if season == 'summer':
        tags.append('夏日')
    elif season == 'winter':
        tags.append('冬日')
    elif season == 'spring':
        tags.append('春日')
    elif season == 'autumn':
        tags.append('秋日')
    for canonical, needles in SCENE_RULES:
        if any(needle in text for needle in needles) and canonical not in tags:
            tags.append(canonical)
    for fallback in SCENE_FALLBACK[scene_type]:
        if fallback not in tags:
            tags.append(fallback)
    if '早午餐' in tags and '午餐' in tags:
        tags.remove('午餐')
    return tags[:6]


def normalize_visual_tags(food):
    group_1 = food['color_group_1']
    group_2 = food['color_group_2']
    tags = [
        f'主色:{food["color_1"]}',
        f'辅色:{food["color_2"]}',
        f'色组:{group_1}+{group_2}',
        f'视觉强度:{food["intensity"]}',
    ]
    for source_tag in food['source_visual_tags']:
        normalized = VISUAL_NORMALIZATION.get(source_tag)
        if normalized and normalized not in tags:
            tags.append(normalized)
        if len(tags) == 6:
            break
    return tags


def extract_ingredient_tags(name):
    matches = []
    for canonical, aliases in INGREDIENT_RULES:
        for alias in aliases:
            start = name.find(alias)
            if start >= 0:
                matches.append((start, start + len(alias), canonical, alias))
    # A shorter overlapping word must not create another ingredient (蟹柳 → 蟹).
    accepted = [m for m in matches if not any(
        other[0] <= m[0] and other[1] >= m[1] and other[1] - other[0] > m[1] - m[0]
        for other in matches
    )]
    return list(dict.fromkeys(m[2] for m in accepted))


def main():
    source = json.loads(SOURCE.read_text(encoding='utf-8'))
    changes = []
    cleaned = []

    for original in source['foods']:
        food = json.loads(json.dumps(original, ensure_ascii=False))
        food['source_visual_tags'] = list(food['visual_tags'])
        food['source_scene_affinity'] = list(food['scene_affinity'])

        before = food['type']
        food['type'] = TYPE_FIXES.get(food['food_id'], food['type'])
        add_change(changes, food, 'type', before, food['type'], '修正食物类别错位')

        before = food['texture']
        food['texture'] = TEXTURE_FIXES.get(food['food_id'], food['texture'])
        add_change(changes, food, 'texture', before, food['texture'], '将味觉/浓度词修正为入口口感')

        before = food['scene_type']
        food['scene_type'] = SCENE_TYPE_FIXES.get(food['food_id'], food['scene_type'])
        add_change(changes, food, 'scene_type', before, food['scene_type'], '将食物类别词修正为氛围类型')

        for index in (1, 2):
            field = f'color_group_{index}'
            color_field = f'color_{index}'
            before = food[field]
            if before == 'multi':
                food[field] = '多色'
            elif food[color_field] == '棕红':
                food[field] = '棕'
            elif food[color_field] == '红褐':
                food[field] = '红'
            add_change(changes, food, field, before, food[field], '统一颜色大类语言与细色映射')

        before = food['scene_affinity']
        food['scene_affinity'] = normalize_scene_affinity(food['source_scene_affinity'], food['scene_type'], food['season'])
        add_change(changes, food, 'scene_affinity', before, food['scene_affinity'], '收敛为受控、可计算的生活场景词')

        before = food['visual_tags']
        food['visual_tags'] = normalize_visual_tags(food)
        add_change(changes, food, 'visual_tags', before, food['visual_tags'], '移除味觉、情绪与营销词，重建可观察视觉标签')

        food['ingredient_tags'] = extract_ingredient_tags(food['name'])
        add_change(changes, food, 'ingredient_tags', None, food['ingredient_tags'], '按名称建立食材关联；未进行图片可见性或配方验证')

        food['food_code'] = f'F{food["food_id"]:03d}'
        cleaned.append(food)

    payload = {
        'meta': {
            'schema_version': 2,
            'record_count': len(cleaned),
            'source': SOURCE.name,
            'field_definitions': FIELD_DEFINITIONS,
            'cleaning_summary': dict(Counter(change['field'] for change in changes)),
        },
        'foods': cleaned,
    }
    taxonomy = {
        'schema_version': 2,
        'allowed_values': ALLOWED,
        'ingredient_tags': [rule[0] for rule in INGREDIENT_RULES],
        'ingredient_aliases': {**{rule[0]: rule[0] for rule in INGREDIENT_RULES}, **DETECTION_ALIASES},
        'ingredient_name_hints': {canonical: aliases for canonical, aliases in INGREDIENT_RULES},
        'scene_affinity': [rule[0] for rule in SCENE_RULES],
        'visual_tag_format': ['主色:<细颜色>', '辅色:<细颜色>', '色组:<主色组>+<辅色组>', '视觉强度:<轻盈|平衡|浓郁>', '<0–2 个可观察外观标签>'],
        'field_definitions': FIELD_DEFINITIONS,
    }

    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    TAXONOMY.write_text(json.dumps(taxonomy, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    pending = [{'food_id': f['food_id'], 'name': f['name'], 'reason': '名称不足以确认食材，需人工或视觉核查'}
               for f in cleaned if not f['ingredient_tags']]
    (AUDIT / 'ingredient-review.json').write_text(json.dumps(pending, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (AUDIT / 'field-changes.json').write_text(json.dumps(changes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    summary = Counter(change['field'] for change in changes)
    value_counts = {
        field: Counter(food[field] for food in cleaned)
        for field in ('type', 'intensity', 'taste', 'temperature', 'texture', 'season', 'scene_type')
    }
    report = [
        '# 数据库字段清洗报告', '',
        f'- 记录数：{len(cleaned)}',
        f'- 字段级变更：{len(changes)}',
        f'- 资产缺失：{sum(food["asset"]["status"] == "missing" for food in cleaned)}', '',
        '## 变更统计', '',
        '| 字段 | 变更记录数 |', '|---|---:|',
    ]
    report.extend(f'| {field} | {count} |' for field, count in summary.most_common())
    report.extend(['', '## 确定性语义修正', '', '| food_id | 名称 | 字段 | 原值 | 新值 |', '|---:|---|---|---|---|'])
    for change in changes:
        if change['field'] in {'type', 'texture', 'scene_type', 'color_group_1', 'color_group_2'}:
            before = json.dumps(change['before'], ensure_ascii=False)
            after = json.dumps(change['after'], ensure_ascii=False)
            report.append(f'| {change["food_id"]} | {change["name"]} | {change["field"]} | {before} | {after} |')
    report.extend(['', '## 清洗后值域', ''])
    for field, counts in value_counts.items():
        report.append(f'- `{field}`：' + '、'.join(f'{name}（{count}）' for name, count in counts.most_common()))
    report.extend(['', '## 保留策略', '', '- 原始 `visual_tags` 保存在 `source_visual_tags`。', '- 原始 `scene_affinity` 保存在 `source_scene_affinity`。', '- 原始数据和图片文件未修改。', '- 每条记录继续保留已复核的 `asset` 对应关系。', ''])
    (AUDIT / 'FIELD_CLEANING_REPORT.md').write_text('\n'.join(report), encoding='utf-8')

    print(json.dumps({'records': len(cleaned), 'changes': len(changes), 'by_field': summary}, ensure_ascii=False, default=dict))


if __name__ == '__main__':
    main()
