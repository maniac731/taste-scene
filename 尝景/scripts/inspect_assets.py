from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import csv, io

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/a86534/Desktop/pic')
raw = Path('/Users/a86534/.codex/attachments/a39ffd23-b37c-491e-8811-ff67919ac980/pasted-text.txt').read_text()
raw = raw.replace('坚果香",""意式', '坚果香"",""意式').replace('咖喱香",""异域', '咖喱香"",""异域')
rows = list(csv.DictReader(io.StringIO(raw), strict=True))
font = ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc', 16)
files = sorted(SOURCE.glob('*.png'), key=lambda p:p.name)
out = ROOT / 'asset-audit/contact-sheets'
out.mkdir(parents=True, exist_ok=True)
for start in range(0, len(files), 48):
    sheet = Image.new('RGB', (1440, 8*205), 'white')
    draw = ImageDraw.Draw(sheet)
    for i,p in enumerate(files[start:start+48]):
        with Image.open(p) as im:
            im.load()
            im.thumbnail((232, 174))
            x,y=(i%6)*240,(i//6)*205
            sheet.paste(im,(x,y))
            name=p.stem
            draw.text((x+3,y+174), f'{start+i+1} {name[:13]}',font=font,fill='black')
    sheet.save(out/f'{start//48+1:02}.jpg')
print('Contact sheets:', len(list(out.glob('*.jpg'))))
print('Files:',len(files),'Rows:',len(rows))
