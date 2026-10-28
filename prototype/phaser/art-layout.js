// Pixel-derived anchors are independent of transparent margins and source canvas size.
export function analyzePixels(width,height,data,enemy=false,strict=false){
 const seen=new Uint8Array(width*height),groups=[];let largest=[];
 for(let n=0;n<seen.length;n++){if(seen[n]||data[n*4+3]<96)continue;const stack=[n],component=[];seen[n]=1;while(stack.length){const k=stack.pop();component.push(k);const x=k%width,y=Math.floor(k/width);for(const next of [x?k-1:-1,x<width-1?k+1:-1,y?k-width:-1,y<height-1?k+width:-1])if(next>=0&&!seen[next]&&data[next*4+3]>=96){seen[next]=1;stack.push(next);}}if(component.length>largest.length)largest=component;if(component.length>=width*height*.004){let lo=width,hi=0;for(const k of component){lo=Math.min(lo,k%width);hi=Math.max(hi,k%width);}if(!(lo<=1&&hi<width*.12))groups.push(component);}}
 const pixels=groups.length?groups.flat():largest;if(!pixels.length)return {bounds:{x:0,y:0,w:width,h:height},foot:{x:width/2,y:height},faceWidth:enemy?null:height*.15};
 let x0=width,y0=height,x1=0,y1=0;for(const n of pixels){const x=n%width,y=Math.floor(n/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}const bottom=pixels.filter(n=>Math.floor(n/width)>=y1-Math.max(2,(y1-y0)*.035));const foot={x:bottom.reduce((sum,n)=>sum+n%width,0)/bottom.length,y:y1+1};
 let faceWidth=(y1-y0+1)*.15;
 if(!enemy){const visited=new Uint8Array(width*height);let best=0;for(let y=y0;y<y0+(y1-y0)*.36;y++)for(let x=x0;x<=x1;x++){const n=y*width+x;if(visited[n]||!skin(n))continue;const stack=[n];visited[n]=1;let count=0,lo=x,hi=x;while(stack.length){const k=stack.pop(),u=k%width,v=Math.floor(k/width);count++;lo=Math.min(lo,u);hi=Math.max(hi,u);for(const next of [u? k-1:-1,u<width-1?k+1:-1,v>y0?k-width:-1,v<y0+(y1-y0)*.36?k+width:-1])if(next>=0&&next<visited.length&&!visited[next]&&skin(next)){visited[next]=1;stack.push(next);}}if(count>best&&hi-lo>=6&&hi-lo<width*.65){best=count;faceWidth=hi-lo+1;}}function skin(n){const i=n*4,r=data[i],g=data[i+1],b=data[i+2];return data[i+3]>128&&r>=115&&g>=65&&b>=40&&r>g+12&&g>b+6&&r-g<100&&g-b<75&&g/b<1.75&&(!strict||(g-b)/(r-b)<.49);}}
 if(!enemy&&!strict&&faceWidth>(y1-y0+1)*.22)return analyzePixels(width,height,data,false,true);
 if(strict&&faceWidth>(y1-y0+1)*.22)faceWidth=(y1-y0+1)*.15;
 return {bounds:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1},foot,faceWidth:enemy?null:Math.max(8,faceWidth)};
}
export function formationExposed(units){return !units.some(c=>c.hp>0&&(c.slot??c.battleSlot)<4);}
export function visualSlot(unit,team){const slot=unit.slot??unit.battleSlot;return slot>=4&&formationExposed(team)?slot%4:slot;}
