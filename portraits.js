import {APPEARANCE_VARIANTS} from './character.js';

// Only cool, chromatic material pixels below the head may change. Head pixels,
// warm skin/leather, neutral metallic highlights and alpha remain unchanged.
const presetMap=new Map(APPEARANCE_VARIANTS.map(v=>[v.id,v]));
export function materialPixel(r,g,b,a,y,variant){
 const preset=presetMap.get(variant);
 if(!preset||preset.hue===null||a===0||y<.34||r>=g&&r>=b)return [r,g,b,a];
 const hi=Math.max(r,g,b)/255,lo=Math.min(r,g,b)/255,d=hi-lo,l=(hi+lo)/2;
 const s=d/(1-Math.abs(2*l-1)||1);
 if(d*255<18||s<.22||l<.07||l>.88)return [r,g,b,a];
 const sat=Math.min(.7,Math.max(.18,s*.65+preset.saturation*.35));
 const light=Math.min(.9,l*preset.shade),chroma=(1-Math.abs(2*light-1))*sat,h=preset.hue/60;
 const x=chroma*(1-Math.abs(h%2-1)),m=light-chroma/2;
 const rgb=h<1?[chroma,x,0]:h<2?[x,chroma,0]:h<3?[0,chroma,x]:h<4?[0,x,chroma]:h<5?[x,0,chroma]:[chroma,0,x];
 return [...rgb.map(v=>Math.round((v+m)*255)),a];
}
const sources=new Map(),rendered=new Map();
function loadSource(url){if(!sources.has(url))sources.set(url,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{sources.delete(url);reject(Error('portrait unavailable'));};img.src=url;}));return sources.get(url);}
export function renderMaterial(url,variant,frame){
 const key=url+'|'+variant+'|'+frame;if(rendered.has(key))return rendered.get(key);
 const promise=loadSource(url).then(img=>{
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0);
  const pixels=context.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
  for(let i=0;i<data.length;i+=4){const y=Math.floor(i/4/canvas.width)/canvas.height;const next=materialPixel(data[i],data[i+1],data[i+2],data[i+3],y,variant);for(let k=0;k<3;k++)data[i+k]=next[k];}
  context.putImageData(pixels,0,0);
  if(frame==='bust'){
   const crop=bustBounds(canvas.width,canvas.height,data),out=document.createElement('canvas');out.width=crop.width;out.height=crop.height;out.getContext('2d').drawImage(canvas,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);return out.toDataURL('image/png');
  }return canvas.toDataURL('image/png');
 }).catch(error=>{rendered.delete(key);throw error;});
 rendered.set(key,promise);if(rendered.size>160)rendered.delete(rendered.keys().next().value);return promise;
}
export function hydratePortraits(root){
 if(!root)return;
 for(const img of root.querySelectorAll('img.character-art[data-look]')){
  const variant=img.dataset.look;if(img.dataset.materialReady)continue;
  img.dataset.materialReady='pending';
  renderMaterial(img.getAttribute('src'),variant,img.dataset.frame||'bust').then(url=>{if(img.isConnected){img.src=url;img.dataset.materialReady='true';}}).catch(()=>{delete img.dataset.materialReady;});
 }
}

export function bustBounds(width,height,pixels){
 let sx=0,count=0;for(let y=Math.floor(height*.09);y<height*.34;y++)for(let x=Math.floor(width*.16);x<width*.74;x++){const i=(y*width+x)*4;if(pixels[i+3]>128&&pixels[i]>pixels[i+1]*1.1&&pixels[i+1]>pixels[i+2]*1.12){sx+=x;count++;}}
 const h=Math.round(height*.49),w=Math.min(width,Math.round(h*1.05)),center=count?sx/count:width*.45;
 return {x:Math.max(0,Math.min(width-w,Math.round(center-w/2))),y:0,width:w,height:h};
}
