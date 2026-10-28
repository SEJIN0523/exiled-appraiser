import {visualSlot} from './art-layout.js';
import {resetAnimations} from './effects-lifecycle.js';
import {createBattle,DEFAULT_FORMATION,slotPoint,planAction,resolveAction,startBattle,retreat,setTactic,isRear} from './battle-model.js';
const P=globalThis.Phaser;
const realWait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export class BattleScene extends P.Scene{
 constructor(options){super('battle');this.options=options;this.views=new Map();this.effects=new Set();this.emitters=new Set();this.runId=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.b=createBattle();this.activeAction=null;this.hitStops=0;this.waiters=new Set();}
 preload(){this.load.image('forest','./assets/forest.webp');for(const [key,m] of Object.entries(this.options.metadata))this.load.image(key,'./assets/'+m.file);}
 create(){
  for(const [key,m] of Object.entries(this.options.metadata)){const r=m.bounds;this.textures.get(key).add('body',0,r.x,r.y,r.w,r.h);}
  const g=this.make.graphics({x:0,y:0,add:false});g.fillStyle(0xffffff).fillCircle(5,5,5);g.generateTexture('spark',10,10);g.clear();g.fillStyle(0xffdba0).fillTriangle(26,4,18,0,18,8).fillRect(0,3,20,2);g.generateTexture('arrow',26,8);g.destroy();
  this.backdrop=this.add.image(0,0,'forest').setOrigin(.5).setDepth(-100);this.veil=this.add.rectangle(0,0,1,1,0x0b1920,.38).setOrigin(0).setDepth(-90);this.ground=this.add.graphics().setDepth(-80);this.slots=this.add.graphics().setDepth(-70);
  this.scale.on('resize',this.layout,this);this.events.once('shutdown',()=>{this.runId++;this.scale.off('resize',this.layout,this);this.cleanup();});
  this.layout();this.renderUnits();this.options.onReady?.(this);this.sync();
 }
 tracked(object,lifetime=800){this.effects.add(object);this.time.delayedCall(lifetime,()=>this.release(object));return object;}
 release(object){if(!object)return;this.effects.delete(object);this.emitters.delete(object);if(object.scene)object.destroy();}
 cleanup(){for(const e of [...this.effects])this.release(e);this.emitters.clear();this.cameras.main.resetFX();}
 layout(){
  const w=this.scale.width,h=this.scale.height;this.w=w;this.h=h;
  if(!this.backdrop)return;this.backdrop.setPosition(w/2,h/2).setDisplaySize(w,h);this.veil.setSize(w,h);
  this.ground.clear().fillStyle(0x253a32,.65).fillEllipse(w/2,h*.56,w*1.5,h*.74).lineStyle(1,0x7ca88f,.08);
  for(let i=0;i<8;i++){const y=h*(.18+i*.105);this.ground.lineBetween(0,y,w,y+h*.15);}
  this.slots.clear();for(const enemy of [false,true])for(let slot=0;slot<8;slot++){const p=slotPoint(slot,enemy,w,h);this.slots.lineStyle(1,enemy?0xc68b7b:0x93c6ba,.17).strokeEllipse(p.x,p.y,Math.min(39,w*.1),12);}
  for(const v of this.views.values())this.place(v);this.sync();
 }
 place(v){const p=slotPoint(v.unit.displaySlot??v.unit.slot,v.unit.side==='enemy',this.w,this.h),m=this.options.metadata[v.unit.texture||v.unit.id];v.home=p;v.node.setPosition(p.x,p.y).setDepth(p.y*10);v.shadow.setPosition(p.x,p.y+1).setDepth(p.y*10-1);v.hud.setPosition(p.x,p.y).setDepth(6000);
  const faceTarget=Math.max(11,Math.min(18,this.h*.031)),scale=m.faceWidth?faceTarget/m.faceWidth:Math.min(this.h*.21/m.bounds.h,this.w*.22/m.bounds.w);
  const limited=Math.min(scale,this.h*.255/m.bounds.h,this.w*.3/m.bounds.w);v.art.setScale(limited);v.height=m.bounds.h*limited;v.width=m.bounds.w*limited;v.shadow.setDisplaySize(Math.min(48,v.width*.6),9);v.name.setFontSize(this.w<350?8:9);}
 renderUnits(){for(const v of this.views.values()){v.idle?.stop();v.node.destroy();v.shadow.destroy();v.hud.destroy();}this.views.clear();for(const u of [...this.b.allies,...this.b.enemies]){
  u.displaySlot=visualSlot(u,u.side==='ally'?this.b.allies:this.b.enemies);
  const key=u.texture||u.id,m=this.options.metadata[key],r=m.bounds,point=slotPoint(u.displaySlot??u.slot,u.side==='enemy',this.w,this.h);
  const shadow=this.add.ellipse(point.x,point.y,45,9,0x000000,.38),node=this.add.container(point.x,point.y);
  const art=this.add.image(0,0,key,'body').setOrigin((m.foot.x-r.x)/r.w,(m.foot.y-r.y)/r.h);
  const name=this.add.text(0,9,u.name,{fontFamily:'sans-serif',fontSize:'9px',color:u.side==='ally'?'#dbece2':'#f0c5a8',stroke:'#102019',strokeThickness:3}).setOrigin(.5,0);
  const bars=this.add.graphics(),hud=this.add.container(point.x,point.y,[name,bars]);node.add(art);const v={unit:u,node,art,shadow,name,bars,hud};this.views.set(u.id,v);this.place(v);if(u.hp<=0){art.setAlpha(.15);shadow.setAlpha(.12);}
  v.idle=this.tweens.add({targets:art,y:this.reduced?-.7:-2.2,duration:1150+u.slot*95,yoyo:true,repeat:-1,paused:u.hp<=0,ease:'Sine.InOut'});
 }this.paintBars();}
 reflow(){for(const v of this.views.values()){if(v.unit.hp<=0)continue;const next=visualSlot(v.unit,v.unit.side==='ally'?this.b.allies:this.b.enemies);if(next===v.unit.displaySlot)continue;v.unit.displaySlot=next;const p=slotPoint(next,v.unit.side==='enemy',this.w,this.h);v.home=p;this.tweens.add({targets:[v.node,v.hud],x:p.x,y:p.y,duration:320,ease:'Sine.InOut',onComplete:()=>v.node.setDepth(p.y*10)});}}
 paintBars(){this.reflow();for(const v of this.views.values()){const u=v.unit;v.bars.clear().fillStyle(0x071411,.9).fillRoundedRect(-24,21,48,9,2).fillStyle(u.side==='ally'?0x83bf9d:0xca8c70).fillRect(-22,23,44*Math.max(0,u.hp/u.maxHp),2).fillStyle(0x79b5d1).fillRect(-22,27,44*Math.max(0,u.mp/u.maxMp),1.5);if(u.hp<=0){v.name.setAlpha(.3);v.bars.setAlpha(.2);}}}
 sync(){this.options.onUpdate?.(this.b,{fps:this.measuredFps||0,effects:this.effects.size,hitStops:this.hitStops});}
 prepare(formation=DEFAULT_FORMATION){if(this.b.phase==='fighting')return false;this.runId++;resetAnimations(this.tweens,this.waiters);this.cleanup();const tactic=this.b.tactic;this.b=createBattle(formation);this.b.tactic=tactic;this.renderUnits();this.sync();return true;}
 setTactic(id){setTactic(this.b,id);this.sync();}
 async begin(){if(!startBattle(this.b))return;const token=++this.runId;this.sync();while(this.b.phase==='fighting'&&token===this.runId){const e=planAction(this.b);if(!e)break;this.activeAction=e;this.sync();await this.animate(e,token);if(token!==this.runId)break;this.activeAction=null;this.paintBars();this.sync();if(this.b.phase==='fighting')await realWait(240);}if(token===this.runId&&this.b.phase!=='fighting'){this.sync();this.options.onFinish?.(this.b);}}
 flee(){if(!retreat(this.b))return false;this.runId++;resetAnimations(this.tweens,this.waiters);this.cleanup();for(const v of this.views.values()){v.art.setPosition(0,0).setAngle(0).clearTint();v.node.setPosition(v.home.x,v.home.y);}this.activeAction=null;this.sync();this.options.onFinish?.(this.b);return true;}
 tween(config){return new Promise(resolve=>{const done=()=>{this.waiters.delete(done);resolve();};this.waiters.add(done);this.tweens.add({...config,onComplete:done,onStop:done});});}
 burst(x,y,color,count=18){const e=this.add.particles(x,y,'spark',{emitting:false,lifespan:{min:220,max:520},speed:{min:35,max:110},angle:{min:0,max:360},scale:{start:.55,end:0},alpha:{start:1,end:0},tint:color,blendMode:'ADD',maxParticles:32}).setDepth(9000);this.emitters.add(e);this.tracked(e,800);e.explode(this.reduced?Math.ceil(count/2):count);return e;}
 circle(v,color){const c=this.add.container(v.home.x,v.home.y).setDepth(v.home.y*10-2),g=this.add.graphics();g.lineStyle(2,color,.85).strokeEllipse(0,0,72,25).lineStyle(1,color,.5).strokeEllipse(0,0,55,18);for(let n=0;n<6;n++){const a=n*Math.PI/3;g.lineBetween(Math.cos(a)*29,Math.sin(a)*10,Math.cos(a)*36,Math.sin(a)*13);}c.add(g).setAlpha(0).setScale(.6);this.tracked(c,1400);this.tweens.add({targets:c,alpha:1,scale:1.1,duration:260,yoyo:true,hold:300});return c;}
 label(text,v,color='#eedfae'){const t=this.add.text(v.node.x,v.node.y-v.height-12,text,{fontFamily:'sans-serif',fontSize:'11px',fontStyle:'bold',color,stroke:'#11251f',strokeThickness:4}).setOrigin(.5).setDepth(10000);this.tracked(t,1000);this.tweens.add({targets:t,y:t.y-14,alpha:0,delay:500,duration:400});}
 async animate(e,token){const a=this.views.get(e.actor),t=this.views.get(e.target);if(!a||!t)return;this.label(e.name+(e.cost?' · MP '+e.cost:''),a);a.idle?.pause();
  if(e.kind==='melee'){
   const direction=a.unit.side==='ally'?1:-1;a.node.setDepth(8000);this.tweens.add({targets:a.art,angle:-direction*7,duration:160});await this.tween({targets:a.node,x:t.home.x-direction*28,y:t.home.y+3,duration:240,ease:'Cubic.Out'});
   if(token!==this.runId)return;await this.impact(e,t,direction,token);if(token!==this.runId)return;
   await this.tween({targets:a.node,x:a.home.x,y:a.home.y,duration:280,ease:'Cubic.InOut'});a.art.setAngle(0);a.node.setDepth(a.home.y*10);
  }else if(e.kind==='ranged'){
   const start={x:a.node.x+(a.unit.side==='ally'?12:-12),y:a.node.y-a.height*.55},end={x:t.home.x,y:t.home.y-t.height*.55};const arrow=this.add.image(start.x,start.y,'arrow').setRotation(Math.atan2(end.y-start.y,end.x-start.x)).setDepth(8500);this.tracked(arrow,1100);await this.tween({targets:arrow,x:end.x,y:end.y,duration:360,ease:'Sine.In'});this.release(arrow);if(token!==this.runId)return;await this.impact(e,t,a.unit.side==='ally'?1:-1,token);
  }else{
   const color=e.kind==='heal'?0x9ee6b5:0x9ec4ff;this.circle(a,color);this.burst(a.node.x,a.node.y-a.height*.4,color,10);await realWait(300);if(token!==this.runId)return;
   if(e.kind==='heal'){this.circle(t,color);await this.impact(e,t,0,token);}else{
    const orb=this.add.circle(a.node.x,a.node.y-a.height*.7,e.heavy?7:5,color,1).setDepth(8500);this.tracked(orb,1200);
    const trail=this.add.particles(0,0,'spark',{follow:orb,frequency:35,lifespan:220,speed:10,tint:color,scale:{start:.35,end:0},alpha:{start:.7,end:0},maxParticles:18,blendMode:'ADD'}).setDepth(8400);this.emitters.add(trail);this.tracked(trail,1100);
    await this.tween({targets:orb,x:t.home.x,y:t.home.y-t.height*.55,duration:420,ease:'Cubic.In'});this.release(trail);this.release(orb);if(token!==this.runId)return;await this.impact(e,t,a.unit.side==='ally'?1:-1,token);
   }
  }
  if(token===this.runId){a.art.setY(0);a.idle?.restart();}
 }
 async hitStop(token){this.hitStops++;this.tweens.pauseAll();for(const e of this.emitters)e.timeScale=0;await realWait(this.reduced?35:75);if(token===this.runId){this.tweens.resumeAll();for(const e of this.emitters)e.timeScale=1;}}
 async impact(e,t,direction,token){if(token!==this.runId||!resolveAction(this.b,e))return;this.paintBars();this.sync();
  const x=t.home.x,y=t.home.y-t.height*.55;
  if(e.miss){this.number('MISS',x,y,'#c6d1c8',false);await this.tween({targets:t.node,x:x+direction*10,duration:100,yoyo:true});return;}
  const color=e.kind==='heal'?0xa5edb7:e.kind==='magic'?0xa8c9ff:e.heavy?0xffcf7b:0xffedc1;
  this.burst(x,y,color,e.heavy?28:16);
  if(e.kind!=='heal'){
   const slash=this.add.graphics().setDepth(9300);slash.lineStyle(e.heavy?5:3,color,1);for(let i=0;i<3;i++)slash.lineBetween(x-20+i*7,y+17,x+17+i*5,y-19);this.tracked(slash,300);this.tweens.add({targets:slash,alpha:0,duration:260});
   t.art.setTintFill(0xffffff);if(e.heavy){await this.hitStop(token);if(token!==this.runId)return;this.cameras.main.shake(180,this.reduced?.001:.006);}
   this.tweens.add({targets:t.art,x:{from:-3,to:3},duration:35,yoyo:true,repeat:2,onComplete:()=>{t.art.setX(0).clearTint();}});
   this.tweens.add({targets:t.node,x:t.home.x+direction*(e.heavy?13:6),duration:95,yoyo:true,ease:'Sine.Out'});
  }
  this.number((e.kind==='heal'?'+':'')+e.value,x,y-8,e.kind==='heal'?'#b1f0ba':e.crit?'#ffd579':'#fff4d1',e.heavy,e.crit);
  if(t.unit.hp<=0){t.idle?.stop();this.tweens.add({targets:t.art,alpha:.15,y:5,duration:420});this.tweens.add({targets:t.shadow,alpha:.12,duration:420});}
  await realWait(e.heavy?180:100);
 }
 number(value,x,y,color,heavy,crit=false){const n=this.add.text(x,y,(crit?'CRITICAL\n':'')+value,{fontFamily:'sans-serif',fontSize:heavy?'25px':'20px',fontStyle:'bold',align:'center',color,stroke:'#13201c',strokeThickness:4}).setOrigin(.5).setDepth(11000);this.tracked(n,1000);this.tweens.add({targets:n,y:y-35,alpha:0,scale:1.1,duration:820,ease:'Cubic.Out'});}
 update(time){for(const v of this.views.values())v.shadow.setPosition(v.node.x,v.node.y+1);this.sampleFrames=(this.sampleFrames||0)+1;if(!this.sampleAt)this.sampleAt=time;if(time-this.sampleAt>=600){this.measuredFps=Math.round(this.sampleFrames*1000/(time-this.sampleAt));this.sampleFrames=0;this.sampleAt=time;this.sync();}}
}
