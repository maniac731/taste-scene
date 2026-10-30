from pathlib import Path
from PIL import Image
import csv
import hashlib
import io
import json


ROOT = Path(__file__).resolve().parents[1]
SOURCE_CSV = Path('/Users/a86534/.codex/attachments/a39ffd23-b37c-491e-8811-ff67919ac980/pasted-text.txt')
SOURCE_IMAGES = Path('/Users/a86534/Desktop/pic')
OUTPUT_DATA = ROOT / 'data/foods-full.json'
OUTPUT_AUDIT = ROOT / 'asset-audit'
GENERATED_IMAGES = {
    '手撕猪肉班尼迪克蛋': ROOT / 'assets/foods/手撕猪肉班尼迪克蛋.png',
}

# These are filename differences confirmed against both the food record and image content.
ALIASES = {
    '培根蘑菇煎蛋吐司': ('培根蘑菇炒蛋吐司.png', '名称近义；图片内容为培根、蘑菇和炒蛋吐司'),
    '松露火腿巴斯克蛋糕': ('松露火腿巴斯克.png', '图片文件名省略“蛋糕”'),
    '橙C美式': ('橙 C 美式.png', '图片文件名含空格'),
    '泰式烤鱿鱼': ('泰汁烤鱿鱼.png', '名称近义；图片内容为泰式酱汁烤鱿鱼'),
    '烟熏三文鱼班尼迪克': ('烟熏三文鱼班尼迪克蛋.png', '图片文件名补充“蛋”'),
    '玫瑰蜜桃沙拉': (' 玫瑰蜜桃沙拉.png', '图片文件名前有空格'),
    '肉沫豆腐': ('肉沫豆腐png.png', '图片文件名误含 png 字样'),
    '芦笋牛肉焗饭': ('芦笋牛肉焗.png', '图片文件名省略“饭”'),
    '菠萝青瓜青柠复合果汁': ('菠萝青瓜瓜青柠复合果汁.png', '图片文件名多一个“瓜”'),
    '蓝椰冰川气泡茶': ('蓝椰冰川气泡茶 .png', '图片文件名尾部有空格'),
    '黑松露蘑菇炒饭': ('黑松露菌菇炒饭.png', '“蘑菇/菌菇”为同义命名'),
}

INVALID_IMAGES = {
    '手撕猪肉班尼迪克蛋开放吐司水彩插画.png': '画面是块状夹层食物，不是班尼迪克蛋开放吐司',
    '手撕猪肉班尼迪克蛋开放吐司水彩插画 (1).png': '画面是卷状菜品，不是班尼迪克蛋开放吐司',
}


def read_rows():
    raw = SOURCE_CSV.read_text(encoding='utf-8-sig')
    # Two source rows are missing one escaped quote inside the embedded JSON arrays.
    raw = raw.replace('坚果香",""意式', '坚果香"",""意式')
    raw = raw.replace('咖喱香",""异域', '咖喱香"",""异域')
    rows = list(csv.DictReader(io.StringIO(raw), strict=True))
    if len(rows) != 406:
        raise ValueError(f'Expected 406 food rows, got {len(rows)}')
    return rows


def image_metadata(path):
    with Image.open(path) as image:
        width, height = image.size
        mode = image.mode
        image_format = image.format
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return {
        'filename': path.name,
        'width': width,
        'height': height,
        'format': image_format,
        'mode': mode,
        'bytes': path.stat().st_size,
        'sha256': digest,
    }


def main():
    rows = read_rows()
    image_paths = {p.name: p for p in SOURCE_IMAGES.glob('*.png')}
    records = []
    used = set()

    for row in rows:
        name = row['name'].strip()
        exact = f'{name}.png'
        note = ''
        if exact in image_paths:
            filename = exact
            status = 'exact'
        elif name in ALIASES:
            filename, note = ALIASES[name]
            status = 'alias_confirmed'
        elif name in GENERATED_IMAGES:
            filename = None
            status = 'generated_replacement'
            note = '原有两张候选图内容错误；已按现有水彩体系补生成正确资产'
        else:
            filename = None
            status = 'missing'
            note = '没有找到对应图片'

        record = dict(row)
        record['food_id'] = int(row['food_id'])
        record['visual_tags'] = json.loads(row['visual_tags'])
        record['scene_affinity'] = json.loads(row['scene_affinity'])
        record['asset'] = {'status': status, 'review_note': note}
        if status == 'generated_replacement':
            generated_path = GENERATED_IMAGES[name]
            record['asset'].update(image_metadata(generated_path))
            record['asset']['project_path'] = generated_path.relative_to(ROOT).as_posix()
        elif filename:
            if filename in used:
                raise ValueError(f'Image assigned more than once: {filename}')
            if filename not in image_paths:
                raise FileNotFoundError(filename)
            used.add(filename)
            record['asset'].update(image_metadata(image_paths[filename]))
        records.append(record)

    unused = []
    for filename in sorted(set(image_paths) - used):
        status = 'rejected_wrong_content' if filename in INVALID_IMAGES else 'unused'
        unused.append({
            **image_metadata(image_paths[filename]),
            'status': status,
            'review_note': INVALID_IMAGES.get(filename, '未分配'),
        })

    counts = {
        'food_records': len(records),
        'exact': sum(r['asset']['status'] == 'exact' for r in records),
        'alias_confirmed': sum(r['asset']['status'] == 'alias_confirmed' for r in records),
        'generated_replacement': sum(r['asset']['status'] == 'generated_replacement' for r in records),
        'missing': sum(r['asset']['status'] == 'missing' for r in records),
        'source_images': len(image_paths),
        'assigned_images': len(used),
        'unused_images': len(unused),
        'rejected_wrong_content': sum(x['status'] == 'rejected_wrong_content' for x in unused),
    }
    if counts != {
        'food_records': 406, 'exact': 394, 'alias_confirmed': 11, 'generated_replacement': 1, 'missing': 0,
        'source_images': 407, 'assigned_images': 405, 'unused_images': 2,
        'rejected_wrong_content': 2,
    }:
        raise ValueError(f'Unexpected reconciliation: {counts}')

    payload = {
        'meta': {
            'schema_version': 1,
            'source_database': SOURCE_CSV.name,
            'source_image_directory': SOURCE_IMAGES.name,
            'counts': counts,
            'status_definitions': {
                'exact': '数据库名称与图片文件名完全一致，并通过批量视觉复核',
                'alias_confirmed': '文件名不同，已结合名称与画面内容人工确认',
                'generated_replacement': '现有候选图内容错误，已生成并复核替代资产',
                'missing': '现有图片中没有内容正确的对应资产',
            },
        },
        'foods': records,
    }
    OUTPUT_DATA.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUTPUT_AUDIT / 'unused-images.json').write_text(json.dumps(unused, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    alias_rows = [r for r in records if r['asset']['status'] == 'alias_confirmed']
    generated_rows = [r for r in records if r['asset']['status'] == 'generated_replacement']
    missing_rows = [r for r in records if r['asset']['status'] == 'missing']
    report = [
        '# 食物数据库与图片资产对应报告', '',
        f'- 食物记录：{counts["food_records"]}',
        f'- 精确对应：{counts["exact"]}',
        f'- 人工确认的别名对应：{counts["alias_confirmed"]}',
        f'- 补生成替代资产：{counts["generated_replacement"]}',
        f'- 缺少正确图片：{counts["missing"]}',
        f'- 图片总数：{counts["source_images"]}',
        f'- 已分配图片：{counts["assigned_images"]}',
        f'- 判定为错图且未分配：{counts["rejected_wrong_content"]}', '',
        '## 人工确认的名称差异', '',
        '| food_id | 数据库名称 | 图片文件名 | 说明 |',
        '|---:|---|---|---|',
    ]
    report.extend(f'| {r["food_id"]} | {r["name"]} | {r["asset"]["filename"]} | {r["asset"]["review_note"]} |' for r in alias_rows)
    report.extend(['', '## 补生成替代资产', '', '| food_id | 数据库名称 | 项目路径 | 说明 |', '|---:|---|---|---|'])
    report.extend(f'| {r["food_id"]} | {r["name"]} | {r["asset"]["project_path"]} | {r["asset"]["review_note"]} |' for r in generated_rows)
    report.extend(['', '## 缺少正确图片', '', '| food_id | 数据库名称 | 说明 |', '|---:|---|---|'])
    report.extend(f'| {r["food_id"]} | {r["name"]} | {r["asset"]["review_note"]} |' for r in missing_rows)
    report.extend(['', '## 未采用图片', '', '| 图片文件名 | 判定 |', '|---|---|'])
    report.extend(f'| {r["filename"]} | {r["review_note"]} |' for r in unused)
    report.extend(['', '## 数据修复', '', '- 修复了 food_id 248 和 400 的嵌套 JSON 引号，使 `visual_tags` 与 `scene_affinity` 可正常解析。', '- 原始 CSV 和原始图片均未修改。', ''])
    (OUTPUT_AUDIT / 'REPORT.md').write_text('\n'.join(report), encoding='utf-8')

    print(json.dumps(counts, ensure_ascii=False))


if __name__ == '__main__':
    main()
