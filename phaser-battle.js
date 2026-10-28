import {prepareBattleAction,commitBattleAction,partyOf,stats,sprite,regionFor} from './engine.js';
import {weaponFor} from './combat.js';
import {appearanceOf} from './character.js';
import {renderMaterial} from './portraits.js';
import {analyzePixels,formationExposed} from './prototype/phaser/art-layout.js';
export const COMMANDS=[['balanced','균형'],['assault','총공세'],['guard','생존']];
export function battleSnapshot(s){
 const allies=partyOf(s).map(c=>{const t=stats(c),weapon=weaponFor(c);return {id:c.id,name:c.name,texture:'unit-'+c.id,side:'ally',slot:s.formation.indexOf(c.id),hp:c.hp,mp:c.mp||0,maxHp:t.maxHp,maxMp:t.maxMp,kind:weapon.magic?'magic':['bow','crossbow'].includes(weapon.id)?'ranged':'melee'};});
 const enemies=s.battle.enemies.map(c=>({id:'foe-'+c.id,name:c.name,texture:c.variant===5?'foe-boss':'foe-'+c.id,side:'enemy',slot:c.battleSlot??c.id,hp:c.hp,mp:c.mp||0,maxHp:c.maxHp,maxMp:c.maxMp,kind:c.caster?'magic':'melee'}));
 return {allies,enemies,phase:'fighting',pending:null,serial:s.turn,turn:s.turn,time:s.battle.time||0,log:[],metrics:{melee:0,ranged:0,magic:0,heal:0,heavy:0,miss:0,protected:0}};
}
export function impactSnapshot(s,event){const snapshot=battleSnapshot(s),target=[...snapshot.allies,...snapshot.enemies].find(c=>c.id===event.target);if(target&&!event.miss)target.hp=event.kind==='heal'?Math.max(0,target.hp-event.value):target.hp+event.value;return snapshot;}
export function visualEvent(s,event,id){const actor=event.actorEnemy?s.battle.enemies.find(c=>c.id===event.source):s.heroes.find(c=>c.id===event.source),ranged=!event.actorEnemy&&['bow','crossbow'].includes(weaponFor(actor).id);return {id,actor:event.actorEnemy?'foe-'+event.source:event.source,target:event.ally?event.target:'foe-'+event.target,kind:event.kind==='heal'?'heal':event.damageType==='magic'?'magic':ranged?'ranged':'melee',heavy:event.manaCost>=24,cost:event.manaCost,name:event.actionName,miss:event.kind==='miss',crit:event.crit,value:event.value,protectedRear:event.formationFactor<1};}
const artCache=new Map();
async function imageMetadata(src,enemy){const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);return {...analyzePixels(canvas.width,canvas.height,ctx.getImageData(0,0,canvas.width,canvas.height).data,enemy),src};}
async function artFor(c){const url=sprite(c),variant=appearanceOf(c).id,key=url+'|'+variant;if(!artCache.has(key))artCache.set(key,renderMaterial(url,variant,'full').then(src=>imageMetadata(src,false)).catch(e=>{artCache.delete(key);throw e;}));if(artCache.size>64)artCache.delete(artCache.keys().next().value);return artCache.get(key);}
async function enemyArt(url){if(!artCache.has(url))artCache.set(url,imageMetadata(url,true).catch(e=>{artCache.delete(url);throw e;}));return artCache.get(url);}
export class PhaserBattlePresenter{
 constructor(options){this.options=options;this.host=document.createElement('div');this.host.className='phaser-host';this.generation=0;this.busy=false;this.loading=false;}
 detach(){this.host.remove();}
 mount(container){if(!container){this.destroy();return;}this.container=container;const s=this.options.getState(),signature=regionFor(s.stage).bg+'|'+partyOf(s).map(c=>c.id+'/'+sprite(c)+'/'+appearanceOf(c).id).join('|');
  if(this.signature===signature&&(this.game||this.loading)){
   container.replaceChildren(this.host);
   if(this.battle!==s.battle&&this.scene){this.generation++;if(this.pending)this.pending.settled=true;this.pending=null;this.busy=false;const view=this.scene;view.runId++;view.tweens.killAll();view.tweens.resumeAll();for(const done of [...view.waiters])done();view.cleanup();view.plan=null;view.b=battleSnapshot(s);view.renderUnits();}
   this.battle=s.battle;
   if(this.scene&&(this.game.scale.width!==container.clientWidth||this.game.scale.height!==container.clientHeight))this.game.scale.resize(container.clientWidth,container.clientHeight);return;
  }
  this.destroy();this.container=container;this.battle=s.battle;this.signature=signature;this.loading=true;container.replaceChildren(this.host);this.host.innerHTML='<div class="phaser-loading">✧<span>전장을 펼치는 중…</span></div>';const generation=++this.generation;
  this.boot(s,generation).catch(error=>{if(generation!==this.generation)return;this.loading=false;this.failed=true;this.host.textContent='전투 효과를 불러오지 못했습니다. 거점으로 귀환한 뒤 다시 출발해 주세요.';console.error('Battle renderer',error);});
 }
 async boot(s,generation){if(!globalThis.Phaser)throw Error('Phaser runtime unavailable');const {BattleScene}=await import('./prototype/phaser/battle-scene.js');const r=regionFor(s.stage),entries=await Promise.all([...partyOf(s).map(async c=>['unit-'+c.id,await artFor(c)]),...[0,1,2,5].map(async variant=>[variant===5?'foe-boss':'foe-'+variant,await enemyArt(`./assets/monsters/${r.monster}-${variant}.webp`)])]);if(generation!==this.generation)return;const metadata=Object.fromEntries(entries),presenter=this;
  class ProductionScene extends BattleScene{
   constructor(options){super(options);this.b=battleSnapshot(presenter.options.getState());}
   preload(){this.load.image('forest',`./assets/bg/bg_${r.bg}.webp`);for(const [key,m] of Object.entries(metadata))this.load.image(key,m.src);}
   async play(plan){this.plan=plan;const current=presenter.options.getState();this.b=battleSnapshot(current);for(const v of this.views.values())v.unit=[...this.b.allies,...this.b.enemies].find(u=>u.id===v.unit.id);const e=visualEvent(current,plan.event,++this.b.serial||1);this.b.pending=e;this.paintBars();const token=++this.runId;await this.animate(e,token);if(token===this.runId)this.plan=null;}
   async impact(e,target,direction,token){if(token!==this.runId)return;const state=presenter.options.getState(),event=commitBattleAction(state,this.plan);if(!event)return;this.committed=event;
    const snapshot=impactSnapshot(state,e);for(const v of this.views.values()){const u=[...snapshot.allies,...snapshot.enemies].find(c=>c.id===v.unit.id);Object.assign(v.unit,{hp:u.hp,mp:u.mp,maxHp:u.maxHp,maxMp:u.maxMp});}
    const animation=super.impact(e,target,direction,token);presenter.options.onImpact?.(event);return animation;
   }
  }
  const scene=new ProductionScene({metadata,onReady:view=>{if(generation!==presenter.generation)return;presenter.scene=view;presenter.loading=false;},onUpdate:()=>{}});this.host.replaceChildren();this.game=new Phaser.Game({type:Phaser.AUTO,parent:this.host,width:this.container.clientWidth,height:this.container.clientHeight,backgroundColor:'#1d3027',scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},fps:{target:60,limit:60},render:{antialias:true,powerPreference:'low-power'},audio:{noAudio:true},scene:[scene]});
 }
 pump(){if(this.failed)return false;if(this.loading||this.busy)return true;if(!this.scene)return true;const s=this.options.getState();if(s.battle!==this.battle)return false;const plan=prepareBattleAction(s);if(!plan)return false;const generation=this.generation;this.busy=true;this.pending=plan;this.scene.committed=null;this.scene.play(plan).then(()=>{if(generation!==this.generation)return;this.busy=false;this.pending=null;this.options.onComplete?.(this.scene.committed);}).catch(error=>{if(generation!==this.generation)return;this.busy=false;this.failed=true;console.error('Battle animation',error);});return true;}
 destroy(){this.generation++;if(this.pending)this.pending.settled=true;this.pending=null;this.busy=false;this.loading=false;this.failed=false;if(this.scene){this.scene.runId++;this.scene.tweens.killAll();this.scene.tweens.resumeAll();for(const done of [...this.scene.waiters])done();this.scene.cleanup();}this.scene=null;if(this.game){const gl=this.game.renderer?.gl;if(gl)this.game.events.once('destroy',()=>queueMicrotask(()=>{try{gl.getExtension('WEBGL_lose_context')?.loseContext();}catch{}}));this.game.destroy(true);}this.game=null;this.battle=null;this.signature=null;this.host.replaceChildren();this.host.remove();}
}
export function exposedMessage(s){const allies=partyOf(s).map(c=>({slot:s.formation.indexOf(c.id),hp:c.hp}));return formationExposed(allies)?'전위 부재 · 후위 노출':'전위가 후위를 보호 중';}
