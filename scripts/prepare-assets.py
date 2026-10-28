from pathlib import Path
from PIL import Image, ImageDraw
import json

source = Path(r'C:\CLAUDE\FIEF\design\output')
dest = Path(__file__).resolve().parent.parent / 'assets'
dest.mkdir(exist_ok=True)
for folder in ['jobs','monsters']:
    (dest/folder).mkdir(exist_ok=True)
    for file in (source/folder).glob('*.png'):
        img=Image.open(file).convert('RGBA')
        w,h=img.size
        for n in range(6):
            cell=img.crop((n%3*w//3,n//3*h//2,(n%3+1)*w//3,(n//3+1)*h//2))
            pixels=cell.load()
            for y in range(cell.height):
                for x in range(cell.width):
                    r,g,b,a=pixels[x,y]
                    if r>170 and b>170 and g<110: pixels[x,y]=(0,0,0,0)
            box=cell.getbbox()
            if box: cell=cell.crop(box)
            cell.thumbnail((240,280),Image.Resampling.LANCZOS)
            cell.save(dest/folder/f'{file.stem}-{n}.webp',quality=88)
for folder in ['bg','story','village']:
    (dest/folder).mkdir(exist_ok=True)
    for file in (source/folder).glob('*.png'):
        img=Image.open(file).convert('RGB')
        img.thumbnail((1280,854),Image.Resampling.LANCZOS)
        img.save(dest/folder/f'{file.stem}.webp',quality=85)
for size in [192,512]:
    img=Image.new('RGB',(size,size),'#172321'); d=ImageDraw.Draw(img)
    d.ellipse((size*.15,size*.15,size*.85,size*.85),outline='#c9ad79',width=max(2,size//40))
    d.polygon([(size*.5,size*.24),(size*.73,size*.5),(size*.5,size*.76),(size*.27,size*.5)],outline='#dfc38b',width=max(2,size//35))
    d.ellipse((size*.43,size*.43,size*.57,size*.57),fill='#dfc38b')
    img.save(dest/f'icon-{size}.png')
(dest/'icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#172321"/><circle cx="50" cy="50" r="36" fill="none" stroke="#c9ad79" stroke-width="2"/><path d="M50 24 73 50 50 76 27 50Z" fill="none" stroke="#dfc38b" stroke-width="3"/><circle cx="50" cy="50" r="7" fill="#dfc38b"/></svg>',encoding='utf-8')
assets=['./assets/'+str(p.relative_to(dest)).replace('\\','/') for p in dest.rglob('*') if p.is_file()]
(dest/'catalog.json').write_text(json.dumps(assets),encoding='utf-8')
print(f'Prepared {len(assets)} assets')
