import {job} from './data.js';
import {talentOf} from './character.js';

export const WEAPONS=[
 {id:'sword',name:'검',hit:2,speed:0,evasion:0,magic:false},
 {id:'spear',name:'창',hit:4,speed:-3,evasion:0,magic:false},
 {id:'staff',name:'지팡이',hit:0,speed:-4,evasion:0,magic:true},
 {id:'bow',name:'장궁',hit:7,speed:6,evasion:2,magic:false},
 {id:'dagger',name:'단검',hit:1,speed:14,evasion:6,magic:false},
 {id:'tome',name:'마도서',hit:0,speed:-7,evasion:0,magic:true},
 {id:'fist',name:'전투장갑',hit:3,speed:10,evasion:4,magic:false},
 {id:'crossbow',name:'석궁',hit:10,speed:-5,evasion:0,magic:false}
];
export const MASTERY_CAP=1000, MASTERY_MAX_XP=20*MASTERY_CAP*MASTERY_CAP;
export const masteryLevel=xp=>Math.min(MASTERY_CAP,Math.floor(Math.sqrt(Math.max(0,xp||0)/20)));
export const masteryNeeded=level=>20*(level+1)*(level+1);
export function defaultWeapon(c){
 const id=c.job;
 if(/crossbow|siegearcher/.test(id))return 'crossbow';
 if(/archer|ranger|hawkeye|hunter|scout|pathfinder/.test(id))return 'bow';
 if(/thief|assassin|nightblade/.test(id))return 'dagger';
 if(/spear|halberd|dragoon|phalanx/.test(id))return 'spear';
 if(/monk|grandmaster/.test(id))return 'fist';
 if(/darkmage|warlock|necromancer|summoner/.test(id))return 'tome';
 return ['마법','치유'].includes(job(id).role)?'staff':'sword';
}
export const weaponFor=c=>WEAPONS.find(w=>w.id===(c.equippedWeaponType||c.baseWeapon||defaultWeapon(c)))||WEAPONS[0];
export const masteryOf=c=>masteryLevel(c.mastery?.[weaponFor(c).id]||0);
export function gainMastery(c,amount){const id=weaponFor(c).id;c.mastery[id]=Math.min(MASTERY_MAX_XP,c.mastery[id]+Math.max(0,Math.floor(amount)));}
export function weaponTypeFromName(name){return WEAPONS.find(w=>String(name).endsWith(' '+w.name))?.id||'sword';}
export function normalizeCombatHero(c){
 if(c.mastery===undefined)c.mastery=Object.fromEntries(WEAPONS.map(w=>[w.id,0]));
 if(!c.mastery||typeof c.mastery!=='object'||Array.isArray(c.mastery)||Object.keys(c.mastery).some(k=>!WEAPONS.some(w=>w.id===k)))throw Error('무기 숙련도 정보 오류');
 for(const w of WEAPONS){if(c.mastery[w.id]===undefined)c.mastery[w.id]=0;const xp=c.mastery[w.id];if(!Number.isInteger(xp)||xp<0||xp>MASTERY_MAX_XP)throw Error('무기 숙련도 정보 오류');}
 if(c.baseWeapon===undefined)c.baseWeapon=defaultWeapon(c);
 if(!WEAPONS.some(w=>w.id===c.baseWeapon))throw Error('기본 무기 정보 오류');
 if(c.tactics===undefined)c.tactics='personality';
 if(!['personality','burst','efficient','support'].includes(c.tactics))throw Error('전투 방침 정보 오류');
}
export function stats(c){
 const role=job(c.job).role,j=job(c.job),tier=j.parent?(job(j.parent).parent?1.65:1.3):1;
 const rank={A:1.12,S:1.24,SS:1.4}[c.potential]||1,base=(1+c.rebirth*.25)*rank*tier;
 const talent=talentOf(c),w=weaponFor(c),mastery=masteryOf(c),level=c.level;
 const wb=c.weapon*9+(c.relicAttack||0),ab=c.armor*5+(c.relicDefense||0);
 const str=Math.floor((10+level*3)*base*(role==='공격'?1.2:role==='마법'?.7:1));
 const int=Math.floor((10+level*3)*base*(['마법','치유'].includes(role)?1.3:.75));
 const vit=Math.floor((10+level*3)*base*(role==='수호'?1.3:1));
 const dex=Math.floor((10+level*2)*base*(w.id==='bow'||w.id==='crossbow'?1.2:1));
 const agi=Math.floor((10+level*2)*base*(['dagger','fist','bow'].includes(w.id)?1.25:.95));
 const mind=Math.floor((10+level*3)*base*(role==='치유'?1.35:role==='마법'?1.15:.85));
 return {
  str,int,vit,dex,agi,mind,
  maxHp:Math.floor((75+vit*5+c.armor*20+(c.relicDefense||0)*3)*(role==='수호'?1.25:1)),
  maxMp:Math.floor(38+int*.65+mind*.35),
  atk:Math.floor((8+str*1.25+wb*(w.magic?.35:1))*talent.attack*(1+mastery*.003)*(c.focus==='attack'?1.2:1)),
  matk:Math.floor((8+int*1.25+wb*(w.magic?1:.35))*talent.attack*(1+mastery*.003)*(c.focus==='attack'?1.2:1)),
  def:Math.floor((3+vit*.55+ab)*talent.defense*(c.focus==='guard'?1.4:1)),
  mdef:Math.floor((3+mind*.65+ab*.8)*talent.defense*(c.focus==='guard'?1.4:1)),
  speed:Math.round(clamp(96+Math.sqrt(agi)*2+w.speed+(role==='수호'?-12:0)+(c.focus==='guard'?-5:0),40,300)),
  accuracy:round(clamp(84+dex*.08+w.hit+mastery*.02,60,99.5)),
  evasion:round(clamp(4+agi*.055+w.evasion,0,40)),
  critical:round(clamp(18+talent.critical*100+dex*.015,0,70)),
  mpRegen:round(5+Math.sqrt(mind)*.65+(w.magic?1.5:0))
 };
}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v)),round=v=>Math.round(v*10)/10;
export const PERSONALITY_STYLES=[
 {name:'신중한 운용',style:'careful',desc:'마나를 일부 남기고, 확실한 때 강한 기술 사용',threshold:.65},
 {name:'경쾌한 연사',style:'efficient',desc:'적은 마나로 약한 기술을 자주 사용',threshold:.55},
 {name:'실리적인 마무리',style:'finisher',desc:'체력이 낮은 적을 노리고 과한 마나 소모를 피함',threshold:.6},
 {name:'동료 우선',style:'support',desc:'위험한 동료의 치료를 우선하고 치료용 마나 확보',threshold:.85},
 {name:'침묵의 한 수',style:'burst',desc:'강한 기술을 위해 마나를 모으고 약한 적 공략',threshold:.55},
 {name:'변칙적인 공세',style:'playful',desc:'마나와 전황에 따라 약한 기술과 강한 기술을 혼합',threshold:.6},
 {name:'정면 돌파',style:'direct',desc:'가장 위협적인 적을 향해 강한 기술을 적극 사용',threshold:.6},
 {name:'과감한 공세',style:'direct',desc:'회복보다 공격을 선호하며 마나를 아끼지 않음',threshold:.45},
 {name:'호쾌한 한 방',style:'burst',desc:'약한 기술을 아끼고 강한 마법·필살기를 선호',threshold:.5}
];
export function behaviorFor(c){
 const innate=PERSONALITY_STYLES[c.identity?.personality]||PERSONALITY_STYLES[0];
 if(c.tactics==='burst')return {...innate,name:'강한 기술 우선',style:'burst',desc:'강한 기술의 마나를 모은 뒤 사용'};
 if(c.tactics==='efficient')return {...innate,name:'효율적인 연사',style:'efficient',desc:'저비용 기술을 자주 사용'};
 if(c.tactics==='support')return {...innate,name:'생존 지원 우선',style:'support',threshold:.9,desc:'치료가 가능한 직업은 위험한 아군부터 치료'};
 return innate;
}
const roleOf=c=>c.enemy?(c.caster?'마법':'공격'):job(c.job).role;
export function actionsFor(c){
 const role=roleOf(c),magic=['마법','치유'].includes(role),w=c.enemy?null:weaponFor(c);
 const discount=magic&&w?.magic?Math.min(.2,masteryOf(c)*.0002):0;
 const cost=n=>Math.max(1,Math.ceil(n*(1-discount)));
 if(role==='치유')return [
  {id:'basic',name:'빛의 투사',cost:0,power:.85,type:'magic'},
  {id:'weak',name:'미광 치유',cost:cost(12),power:1.65,type:'heal'},
  {id:'strong',name:'생명의 기도',cost:cost(30),power:3.4,type:'heal'}
 ];
 return magic?[
  {id:'basic',name:'마력 투사',cost:0,power:.8,type:'magic'},
  {id:'weak',name:'마력탄',cost:cost(12),power:1.65,type:'magic'},
  {id:'strong',name:'붕괴의 술식',cost:cost(34),power:3.8,type:'magic'}
 ]:[
  {id:'basic',name:'기본 공격',cost:0,power:1,type:'physical'},
  {id:'weak',name:'연속 타격',cost:cost(9),power:1.5,type:'physical'},
  {id:'strong',name:'결정의 일격',cost:cost(26),power:2.9,type:'physical'}
 ];
}
const attributes=c=>c.enemy?c:stats(c);
export function hitChance(attacker,defender,type='physical'){return clamp((attacker.accuracy-defender.evasion+(type==='magic'?5:0))/100,.1,.995);}
export function damageAmount(attacker,defender,action,{critical=false,buff=false,exposed=false,variance=1}={}){
 const magical=action.type==='magic',attack=magical?attacker.matk:attacker.atk,defense=magical?defender.mdef:defender.def;
 const pivot=90+(attacker.level||1)*4;
 return Math.max(1,Math.floor(attack*action.power*pivot/(pivot+defense*1.8)*(critical?1.7:1)*(buff?1.5:1)*(exposed?1.35:1)*clamp(variance,.9,1.1)));
}
export function chooseAction(c,allies,enemies){
 const list=actionsFor(c),[basic,weak,strong]=list,style=behaviorFor(c),s=attributes(c),mp=c.mp||0;
 let target=[...enemies].sort((a,b)=>a.hp-b.hp)[0],action=basic;
 if(style.style==='direct')target=[...enemies].sort((a,b)=>attributes(b).atk+attributes(b).matk-attributes(a).atk-attributes(a).matk)[0];
 else if(!['finisher','burst'].includes(style.style))target=enemies[0];
 if(roleOf(c)==='치유'){
  const hurt=[...allies].sort((a,b)=>a.hp/attributes(a).maxHp-b.hp/attributes(b).maxHp)[0];
  const fraction=hurt.hp/attributes(hurt).maxHp,missing=attributes(hurt).maxHp-hurt.hp;
  if(fraction<style.threshold){
   if(mp>=strong.cost&&(fraction<.35||style.style==='burst'||missing>s.matk*weak.power*1.6))return {action:strong,target:hurt};
   if(mp>=weak.cost)return {action:weak,target:hurt};
  }
  return {action:basic,target};
 }
 const canStrong=mp>=strong.cost,canWeak=mp>=weak.cost;
 if(style.style==='burst')action=canStrong?strong:basic;
 else if(style.style==='efficient')action=canWeak?weak:basic;
 else if(style.style==='finisher'){
  if(target.hp<=damageAmount({...s,level:c.level},attributes(target),basic))action=basic;
  else if(target.hp<=damageAmount({...s,level:c.level},attributes(target),weak)&&canWeak)action=weak;
  else action=canStrong?strong:canWeak?weak:basic;
 }else if(style.style==='careful'||style.style==='support'){
  const reserve=s.maxMp*.2;
  action=mp>=strong.cost+reserve?strong:mp>=weak.cost+reserve?weak:basic;
 }else if(style.style==='playful')action=canStrong&&Math.floor(c.actionsTaken||0)%2===0?strong:canWeak?weak:basic;
 else action=canStrong?strong:canWeak?weak:basic;
 return {action,target};
}
export function initializeCombat(s,r){
 const stage=s.stage,boss=stage%5===0,scale=1+stage*.2+stage*stage*.002;
 s.battle={enemies:Array.from({length:boss?1:3},(_,i)=>{
  const caster=i===2||boss&&Math.floor(stage/10)%2===1;
  const maxHp=Math.floor((boss?290:64)*scale),speed=90+(i===1?9:0)+Math.min(35,Math.sqrt(stage)*2);
  return {enemy:true,id:i,name:(boss?'우두머리 ':'')+(r?.enemy||'몬스터'),level:stage+2,hp:maxHp,maxHp,mp:caster?25:12,maxMp:caster?65:40,mpRegen:caster?8:5,atk:Math.floor((boss?22:11)*scale),matk:Math.floor((boss?25:13)*scale),def:Math.floor(4+stage*1.5),mdef:Math.floor(4+stage*(caster?2:1.1)),speed,accuracy:88+Math.min(8,stage*.08),evasion:Math.min(18,4+stage*.06),critical:boss?12:5,caster,tactics:boss?'burst':'efficient',variant:boss?5:i,nextAct:100/speed,actionDelay:100/speed,actionsTaken:0};
 }),round:0,outcome:null,time:0,lastAction:null};
 for(const c of s.heroes.filter(c=>s.party.includes(c.id))){const t=stats(c);c.hp=t.maxHp;c.mp=Math.floor(t.maxMp*.4);c.nextAct=100/t.speed;c.actionDelay=100/t.speed;c.actionsTaken=0;}
}
export function turnOrder(s,count=5){
 const units=[...s.heroes.filter(c=>s.party.includes(c.id)&&c.hp>0),...s.battle.enemies.filter(c=>c.hp>0)].map(c=>({id:c.id,name:c.name,enemy:!!c.enemy,next:c.nextAct,delay:100/attributes(c).speed}));
 const result=[];for(let n=0;n<count&&units.length;n++){units.sort((a,b)=>a.next-b.next||Number(a.enemy)-Number(b.enemy));const c=units[0];result.push({id:c.id,name:c.name,enemy:c.enemy});c.next+=c.delay;}return result;
}
export function actionProgress(c,time){return clamp(100*(1-(c.nextAct-time)/(c.actionDelay||1)),0,100);}
export function stepCombat(s,random=Math.random){
 const b=s.battle,allies=s.heroes.filter(c=>s.party.includes(c.id)&&c.hp>0),enemies=b.enemies.filter(c=>c.hp>0);
 if(!allies.length||!enemies.length)return null;
 const units=[...allies,...enemies],actor=[...units].sort((a,z)=>a.nextAct-z.nextAct||Number(!!a.enemy)-Number(!!z.enemy))[0];
 const elapsed=Math.max(0,actor.nextAct-b.time);b.time=Math.max(b.time,actor.nextAct);
 for(const c of units){const t=attributes(c);c.mp=Math.min(t.maxMp,(c.mp||0)+elapsed*t.mpRegen);}
 const friends=actor.enemy?enemies:allies,foes=actor.enemy?allies:enemies;
 const {action,target}=chooseAction(actor,friends,foes),attacker={...attributes(actor),level:actor.level},defender=attributes(target);
 actor.mp=Math.max(0,actor.mp-action.cost);actor.actionsTaken=(actor.actionsTaken||0)+1;
 actor.actionDelay=100/attacker.speed;actor.nextAct=b.time+actor.actionDelay;
 const event={source:actor.id,target:target.id,ally:!target.enemy,actorEnemy:!!actor.enemy,actorName:actor.name,actionName:action.name,actionId:action.id,manaCost:action.cost,damageType:action.type,kind:'hit',value:0,elapsed};
 if(action.type==='heal'){
  const healing=Math.floor(attacker.matk*action.power*(actor.enemy?1:talentOf(actor).healing));
  event.value=Math.min(healing,Math.max(0,defender.maxHp-target.hp));target.hp+=event.value;event.kind='heal';
 }else if(random()>=hitChance(attacker,defender,action.type)){event.kind='miss';}
 else{
  event.crit=random()<attacker.critical/100;
  event.value=damageAmount(attacker,defender,action,{critical:event.crit,buff:!actor.enemy&&s.buff>0,exposed:!actor.enemy&&s.exposed>0,variance:.9+random()*.2});
  target.hp=Math.max(0,target.hp-event.value);
 }
 if(!actor.enemy)gainMastery(actor,event.kind==='miss'?2:action.cost?8:4);
 s.turn++;b.round=s.turn;b.lastAction=event;
 return event;
}
