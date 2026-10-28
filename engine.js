import {job, JOBS, REGIONS, RECRUITS} from './data.js';
import {stats,initializeCombat,stepCombat,normalizeCombatHero,WEAPONS,weaponTypeFromName,gainMastery} from './combat.js';
export {stats} from './combat.js';
import {createIdentity,createAppearance,validateIdentity,validateAppearance,talentOf,normalizeAppearance} from './character.js';
export const SAVE_KEY='exiled-appraiser-v1';
export const MAX_OFFLINE=8*60*60;
export const xpNeed = c => Math.floor(30+c.level*15);
export const trainCost = c => Math.floor(35+c.level*14);
export const sprite = c => `./assets/jobs/${c.job}-${c.variant}.webp`;
export const regionFor = stage => REGIONS[Math.floor((stage-1)/10)%REGIONS.length];
export function newHero(id,name,j,variant,potential,age=26,level=1){const c={id,name,job:j,variant,potential,age,level,xp:0,bond:0,freed:false,married:false,rebirth:0,weapon:0,armor:0,relicAttack:0,relicDefense:0,focus:'balanced',hp:100,identity:createIdentity(id),appearance:createAppearance(id)};normalizeCombatHero(c);return c;}
export function freshState(now=Date.now()){
 const s={version:1,gold:800,gems:120,stage:1,best:1,wins:0,kills:0,totalGold:0,auto:true,autoContinue:true,speed:1,paused:false,party:['elina','rune','kyle'],heroes:[newHero('elina','엘리나','swordsman',3,'S',27,3),newHero('rune','루네','mage',3,'A',25,2),newHero('kyle','카일','archer',0,'A',31,2)],recruited:[],skills:{appraise:0,rally:0,heal:0},buff:0,exposed:0,storyRead:[],quests:[],savedAt:now,log:[],battle:null,turn:0};
 s.inventory=[];s.itemSerial=0;startBattle(s);return s;
}
export const partyOf = s => s.party.map(id=>s.heroes.find(c=>c.id===id)).filter(Boolean);
export const power = s => partyOf(s).reduce((p,c)=>{const t=stats(c);return p+Math.max(t.atk,t.matk)*3+t.def+t.mdef+Math.round(t.maxHp/5)+Math.round(t.speed/5);},0);
export function startBattle(s){
 initializeCombat(s,regionFor(s.stage));s.turn=0;s.buff=0;s.exposed=0;
}
export function addLog(s,text,type='normal'){s.log.unshift({text,type});s.log=s.log.slice(0,35);}
function addXp(c,amount){c.xp+=amount;while(c.xp>=xpNeed(c)&&c.level<9999){c.xp-=xpNeed(c);c.level++;}}
export function win(s){
 const gold=Math.floor(28+s.stage*9), xp=14+s.stage*3;
 s.gold+=gold;s.totalGold+=gold;s.wins++;s.kills+=s.battle.enemies.length;
 for(const c of partyOf(s)){addXp(c,xp);c.bond=Math.min(100,c.bond+.25);}
 if(s.stage%5===0)s.gems+=5;
 if(s.wins%3===0&&s.inventory.length<120){const item=rollItem(s);addLog(s,`전리품 발견 · ${item.name}`,'reward');}
 s.best=Math.max(s.best,s.stage+1);s.battle.outcome='win';
 addLog(s,`${s.stage} 구역 돌파 · 금화 +${gold} · 경험치 +${xp}`,'reward');
 return {gold,xp};
}
export function tick(s,random=Math.random){
 if(s.paused||!s.auto||!s.party.length)return null;
 const b=s.battle;
 if(b.outcome){
  if(b.outcome==='win'&&s.autoContinue)s.stage++;
  if(b.outcome==='lose')s.stage=Math.max(1,s.stage-1);
  startBattle(s);return {kind:'start'};
 }
 for(const k of Object.keys(s.skills))s.skills[k]=Math.max(0,s.skills[k]-1);
 const event=stepCombat(s,random);if(!event)return null;
 s.buff=Math.max(0,s.buff-1);s.exposed=Math.max(0,s.exposed-1);
 const target=event.ally?s.heroes.find(c=>c.id===event.target):b.enemies.find(c=>c.id===event.target);
 addLog(s,`${event.actorName} · ${event.actionName}${event.manaCost?' (MP −'+event.manaCost+')':''} → ${target?.name||''} · ${event.kind==='miss'?'회피':event.kind==='heal'?'회복 +'+event.value:(event.crit?'치명타 ':'')+event.value}`,event.kind==='heal'?'skill':'normal');
 if(b.enemies.every(e=>e.hp===0)){win(s);event.victory=true;}
 else if(partyOf(s).every(c=>c.hp===0)){b.outcome='lose';addLog(s,'원정대 후퇴 · 동료를 육성한 뒤 다시 도전하세요.','danger');event.defeat=true;}
 return event;
}
export function useSkill(s,id){
 if(!Object.hasOwn(s.skills,id)||s.skills[id]>0||s.paused||s.battle.outcome)return false;
 if(id==='appraise'){s.exposed=12;addLog(s,`감정안 · ${regionFor(s.stage).weak} 약점 간파! 12턴 동안 피해 +35%`,'skill');}
 if(id==='rally'){s.buff=10;addLog(s,'전술 지휘 · 10턴 동안 공격력 +50%','skill');}
 if(id==='heal'){for(const c of partyOf(s))c.hp=Math.min(stats(c).maxHp,c.hp+Math.floor(stats(c).maxHp*.45));addLog(s,'생명 공명 · 원정대 체력 45% 회복','skill');}
 s.skills[id]=id==='heal'?30:22;return true;
}
export function train(s,id){const c=s.heroes.find(h=>h.id===id);if(!c||c.level>=9999||s.gold<trainCost(c))return false;s.gold-=trainCost(c);c.level++;c.hp=stats(c).maxHp;return true;}
export function upgrade(s,id,slot){const c=s.heroes.find(h=>h.id===id);if(!c||!['weapon','armor'].includes(slot))return false;const cost=80+40*c[slot];if(s.gold<cost)return false;s.gold-=cost;c[slot]++;return true;}
export function changeJob(s,id,next){const c=s.heroes.find(h=>h.id===id),j=JOBS.find(j=>j.id===next);if(!c||!j||c.job===next||c.level<10||s.gold<300||(j.parent&&j.parent!==c.job))return false;s.gold-=300;c.job=next;c.hp=stats(c).maxHp;c.mp=Math.min(c.mp||0,stats(c).maxMp);addLog(s,`${c.name} → ${j.name} 전직 완료`,'reward');return true;}
export function rebirth(s,id){const c=s.heroes.find(h=>h.id===id);if(!c||c.level<30||s.gems<30)return false;s.gems-=30;c.level=1;c.xp=0;c.rebirth++;c.hp=stats(c).maxHp;c.mp=Math.min(c.mp||0,stats(c).maxMp);return true;}
export function recruit(s,index){const r=RECRUITS[index];if(!r||s.recruited.includes(index)||s.gold<r.cost)return false;s.gold-=r.cost;s.recruited.push(index);const c=newHero('recruit'+index,r.name,r.job,r.variant,r.potential,r.age);s.heroes.push(c);if(s.party.length<4)s.party.push(c.id);return true;}
export function relationship(s,id,action,giftType){
 const c=s.heroes.find(h=>h.id===id);if(!c)return false;
 if(action==='gift'&&s.gold>=100){s.gold-=100;const identity=c.identity||createIdentity(c.id);c.bond=Math.min(100,c.bond+(giftType===identity.likes?15:giftType===identity.dislikes?5:10));return true;}
 if(action==='free'&&!c.freed&&s.best>=12){c.freed=true;return true;}
 if(action==='marry'&&c.freed&&c.bond>=100&&!c.married){c.married=true;return true;}
 return false;
}
export function setBaseWeapon(s,id,type){const c=s.heroes.find(h=>h.id===id);if(!c||!WEAPONS.some(w=>w.id===type))return false;c.baseWeapon=type;return true;}
export function setTactics(s,id,tactics){const c=s.heroes.find(h=>h.id===id);if(!c||!['personality','burst','efficient','support'].includes(tactics))return false;c.tactics=tactics;return true;}
const ITEM_TYPES=[['검','weapon'],['창','weapon'],['지팡이','weapon'],['장궁','weapon'],['단검','weapon'],['마도서','weapon'],['전투장갑','weapon'],['석궁','weapon'],['갑옷','armor'],['망토','armor'],['로브','armor'],['방패','armor']];
export function rollItem(s,random=Math.random){
 const [type,slot]=ITEM_TYPES[Math.floor(random()*ITEM_TYPES.length)],r=random(),rarity=r>.96?3:r>.8?2:r>.45?1:0;
 const item={id:++s.itemSerial,name:['순례자의','잊힌 별의','고대 왕의','귀환자의'][rarity]+' '+type,slot,rarity,power:Math.floor((5+Math.max(1,s.best-1)*2)*(1+rarity*.65)),owner:null};
 if(slot==='weapon')item.weaponType=weaponTypeFromName(item.name);s.inventory.push(item);return item;
}
export function equipItem(s,heroId,itemId){const c=s.heroes.find(h=>h.id===heroId),item=s.inventory.find(i=>i.id===itemId);if(!c||!item)return false;
 for(const old of s.inventory)if(old.owner===c.id&&old.slot===item.slot)old.owner=null;
 item.owner=c.id;syncEquipment(s);return true;
}
export function salvageItem(s,itemId){const item=s.inventory.find(i=>i.id===itemId);if(!item||item.owner)return false;s.gold+=item.power*4;s.inventory=s.inventory.filter(i=>i.id!==itemId);return true;}
function syncEquipment(s){for(const c of s.heroes){const w=s.inventory.find(i=>i.owner===c.id&&i.slot==='weapon');c.relicAttack=w?.power||0;c.equippedWeaponType=w?.weaponType||null;c.relicDefense=s.inventory.find(i=>i.owner===c.id&&i.slot==='armor')?.power||0;}}
export function offline(s,seconds){
 const elapsed=Math.max(0,Math.min(MAX_OFFLINE,seconds));
 if(elapsed<60||!s.auto||s.paused)return null;
 const runs=Math.floor(elapsed/25),stage=Math.max(1,s.best-1),gold=runs*Math.floor((28+stage*9)*.4),xp=runs*Math.floor((14+stage*3)*.4);
 s.gold+=gold;s.totalGold+=gold;for(const c of partyOf(s)){addXp(c,xp);gainMastery(c,runs*2);}
 return {seconds:elapsed,gold,xp,mastery:runs*2};
}
export function serialize(s,now=Date.now()){return JSON.stringify({...s,savedAt:now});}
export function restore(raw,now=Date.now()){
 const x=JSON.parse(raw);
 if(x.version!==1||!Array.isArray(x.heroes)||x.heroes.length<1||x.heroes.length>20)throw Error('지원하지 않는 저장 파일입니다.');
 const num=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 for(const k of ['gold','gems','totalGold','wins','kills'])if(!num(x[k],0,1e15))throw Error('저장 수치가 올바르지 않습니다.');
 for(const k of ['stage','best'])if(!Number.isInteger(x[k])||!num(x[k],1,1000000))throw Error('잘못된 구역입니다.');
 const ids=new Set();
 for(const c of x.heroes){if(typeof c.id!=='string'||! /^[a-zA-Z0-9_-]{1,40}$/.test(c.id)||ids.has(c.id)||typeof c.name!=='string'||c.name.length>24||!JOBS.some(j=>j.id===c.job)||!['A','S','SS'].includes(c.potential))throw Error('동료 정보가 올바르지 않습니다.');ids.add(c.id);for(const k of ['level','xp','bond','rebirth','weapon','armor','variant','age'])if(!num(c[k],0,k==='variant'?5:k==='bond'?100:k==='level'?9999:1e9))throw Error('동료 수치가 올바르지 않습니다.');if(!Number.isInteger(c.variant)||c.age<20||c.level<1)throw Error('동료 정보 오류');}
 if(!Array.isArray(x.party)||x.party.length<1||x.party.length>4||new Set(x.party).size!==x.party.length||x.party.some(id=>!ids.has(id)))throw Error('원정대 정보가 올바르지 않습니다.');
 for(const k of ['recruited','storyRead','quests'])if(!Array.isArray(x[k])||x[k].some(v=>!Number.isInteger(v)||v<0||v>100))throw Error('저장 진행도 오류');
 if(![1,2,4].includes(x.speed)||!['auto','autoContinue','paused'].every(k=>typeof x[k]==='boolean')||!num(x.savedAt,0,now+86400000))throw Error('저장 설정 오류');
 for(const c of x.heroes){c.freed=c.freed===true;c.married=c.married===true&&c.freed;c.focus=['balanced','attack','guard'].includes(c.focus)?c.focus:'balanced';
  if(c.identity===undefined)c.identity=createIdentity(c.id);
  normalizeAppearance(c);
  if(!validateIdentity(c.identity)||!validateAppearance(c.appearance))throw Error('동료의 고유 특성 또는 색상 정보가 올바르지 않습니다.');
  normalizeCombatHero(c);
 }
 x.inventory=x.inventory||[];x.itemSerial=x.itemSerial||0;
 if(!Array.isArray(x.inventory)||x.inventory.length>120||!Number.isInteger(x.itemSerial)||!num(x.itemSerial,0,1e12))throw Error('장비 정보 오류');
 const itemIds=new Set(),slots=new Set();
 for(const item of x.inventory){if(!Number.isInteger(item.id)||!num(item.id,1,x.itemSerial)||itemIds.has(item.id)||typeof item.name!=='string'||item.name.length>40||!['weapon','armor'].includes(item.slot)||!Number.isInteger(item.rarity)||!num(item.rarity,0,3)||!num(item.power,0,1e10)||!(item.owner===null||ids.has(item.owner)))throw Error('장비 정보 오류');if(item.slot==='weapon'){if(item.weaponType===undefined)item.weaponType=weaponTypeFromName(item.name);if(!WEAPONS.some(w=>w.id===item.weaponType))throw Error('무기 종류 정보 오류');}itemIds.add(item.id);if(item.owner){const key=item.owner+item.slot;if(slots.has(key))throw Error('중복 착용 정보 오류');slots.add(key);}}
 syncEquipment(x);
 x.log=[];x.skills={appraise:0,rally:0,heal:0};startBattle(x);
 const reward=offline(x,(now-x.savedAt)/1000);x.savedAt=now;return {state:x,reward};
}
