from pathlib import Path
import json,shutil
from PIL import Image
root=Path(__file__).resolve().parents[2]
out=Path(__file__).resolve().parent/'assets';out.mkdir(exist_ok=True)
entries=[('knight','jobs/knight-2.webp',32),('ranger','jobs/ranger-3.webp',30),('mage','jobs/mage-2.webp',34),('healer','jobs/priest-4.webp',30),('rogue','jobs/thief-4.webp',30),('spear','jobs/spearman-2.webp',26),('crossbow','jobs/crossbowman-2.webp',30),('goblin','monsters/goblins-0.webp',None),('brute','monsters/goblins-1.webp',None),('shaman','monsters/goblins-2.webp',None)]
meta={}
for key,source,face in entries:
 src=root/'assets'/source;dest=out/(key+'.webp');shutil.copyfile(src,dest)
 im=Image.open(src).convert('RGBA');w,h=im.size;pixels=im.getchannel('A').load();seen=set();groups=[]
 for y in range(h):
  for x in range(w):
   if pixels[x,y]<96 or (x,y) in seen:continue
   stack=[(x,y)];seen.add((x,y));component=[]
   while stack:
    u,v=stack.pop();component.append((u,v))
    for nx,ny in ((u-1,v),(u+1,v),(u,v-1),(u,v+1)):
     if 0<=nx<w and 0<=ny<h and (nx,ny) not in seen and pixels[nx,ny]>=96:seen.add((nx,ny));stack.append((nx,ny))
   if len(component)>=w*h*.004 and not (min(u for u,v in component)<=1 and max(u for u,v in component)<w*.12):groups.extend(component)
 if not groups:groups=[(0,0),(w-1,h-1)]
 x0=min(x for x,y in groups);x1=max(x for x,y in groups);y0=min(y for x,y in groups);y1=max(y for x,y in groups)
 feet=[x for x,y in groups if y>=y1-max(2,int((y1-y0)*.035))];fx=sum(feet)/len(feet)
 meta[key]={'file':dest.name,'source':source,'bounds':{'x':x0,'y':y0,'w':x1-x0+1,'h':y1-y0+1},'foot':{'x':round(fx,2),'y':y1+1},'faceWidth':face,'facing':'right' if face else 'left'}
shutil.copyfile(root/'assets/bg/bg_forest.webp',out/'forest.webp')
(out/'metadata.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
