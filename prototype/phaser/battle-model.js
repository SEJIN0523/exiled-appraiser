export const TACTICS={balanced:{name:'균형',desc:'마나와 생존을 균형 있게 운용'},assault:{name:'총공세',desc:'강력한 기술과 후위 적 공략 우선'},guard:{name:'생존 우선',desc:'피해 감소 · 치료와 마나 확보 우선'}};
export const ROSTER=[
 {id:'knight',name:'아델',role:'수호',kind:'melee',maxHp:700,atk:54,def:20,speed:91,maxMp:70},
 {id:'ranger',name:'피오라',role:'궁수',kind:'ranged',maxHp:420,atk:62,def:10,speed:109,maxMp:70},
 {id:'mage',name:'비올라',role:'마법',kind:'magic',maxHp:390,atk:75,def:9,speed:94,maxMp:100},
 {id:'healer',name:'모카',role:'치유',kind:'heal',maxHp:440,atk:49,def:12,speed:98,maxMp:95},
 {id:'rogue',name:'니아',role:'도적',kind:'melee',maxHp:460,atk:58,def:11,speed:121,maxMp:75},
 {id:'spear',name:'마르타',role:'창병',kind:'melee',maxHp:570,atk:62,def:16,speed:97,maxMp:70},
 {id:'crossbow',name:'로제',role:'석궁',kind:'ranged',maxHp:450,atk:70,def:10,speed:95,maxMp:75}
];
export const DEFAULT_FORMATION=['knight',null,'rogue',null,null,'ranger','mage','healer'];
export const isRear=u=>u.slot>=4;
export function validFormation(slots){return Array.isArray(slots)&&slots.length===8&&slots.filter(Boolean).length>=1&&slots.filter(Boolean).length<=5&&new Set(slots.filter(Boolean)).size===slots.filter(Boolean).length&&slots.every(id=>id===null||ROSTER.some(c=>c.id===id));}
export function assign(slots,id,slot){if(!ROSTER.some(c=>c.id===id)||!Number.isInteger(slot)||slot<0||slot>7)return null;const next=[...slots],old=next.indexOf(id),occupant=next[slot];if(old<0&&!occupant&&next.filter(Boolean).length>=5)return null;if(old>=0)next[old]=occupant;next[slot]=id;return validFormation(next)?next:null;}
export function unassign(slots,slot){const next=[...slots];next[slot]=null;return validFormation(next)?next:null;}
export function slotPoint(slot,enemy,width,height){const row=slot%4,rear=slot>=4;return {x:width*((enemy?(rear?.85:.64):(rear?.15:.36))+(row-1.5)*.014),y:height*(.32+row*.185+(rear?.01:0))};}
function unit(data,side,slot){return {...data,side,slot,hp:data.maxHp,mp:Math.floor(data.maxMp*.62),actions:0,next:100/data.speed};}
export function createBattle(formation=DEFAULT_FORMATION){if(!validFormation(formation))throw Error('전위·후위 8칸에 최대 5명을 배치하세요.');const allies=formation.flatMap((id,slot)=>id?[unit(ROSTER.find(c=>c.id===id),'ally',slot)]:[]);const enemies=[unit({id:'enemy-0',texture:'goblin',name:'습격 고블린',kind:'melee',maxHp:680,atk:44,def:12,speed:103,maxMp:65},'enemy',0),unit({id:'enemy-1',texture:'brute',name:'철퇴 전사',kind:'melee',maxHp:860,atk:60,def:22,speed:82,maxMp:70},'enemy',2),unit({id:'enemy-2',texture:'shaman',name:'숲의 주술사',kind:'magic',maxHp:650,atk:65,def:11,speed:96,maxMp:100},'enemy',5)];return {allies,enemies,phase:'ready',tactic:'balanced',time:0,turn:0,pending:null,serial:0,log:[],metrics:{melee:0,ranged:0,magic:0,heal:0,heavy:0,miss:0,protected:0}};}
export const alive=units=>units.filter(c=>c.hp>0);
export function legalTargets(actor,enemies){const living=alive(enemies),front=living.filter(c=>!isRear(c));return actor.kind==='melee'&&front.length?front:living;}
export function startBattle(b){if(b.phase!=='ready')return false;b.phase='fighting';return true;}
export function retreat(b){if(b.phase!=='fighting')return false;b.phase='retreated';b.pending=null;return true;}
export function setTactic(b,id){if(!Object.hasOwn(TACTICS,id))return false;b.tactic=id;return true;}
export function planAction(b,random=Math.random){
 if(b.phase!=='fighting'||b.pending)return null;const all=[...alive(b.allies),...alive(b.enemies)];const actor=all.sort((a,z)=>a.next-z.next)[0];if(!actor)return null;
 const elapsed=Math.max(0,actor.next-b.time);b.time=actor.next;for(const c of all)c.mp=Math.min(c.maxMp,c.mp+elapsed*(c.kind==='magic'||c.kind==='heal'?13:9));
 const friends=actor.side==='ally'?b.allies:b.enemies,foes=actor.side==='ally'?b.enemies:b.allies,tactic=actor.side==='ally'?b.tactic:actor.kind==='magic'?'assault':'balanced';
 let candidates=legalTargets(actor,foes),target=[...candidates].sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];if(!target)return null;
 if(tactic==='assault'&&actor.kind!=='melee')target=[...candidates].sort((a,z)=>Number(isRear(z))-Number(isRear(a))||a.hp-z.hp)[0];
 let kind=actor.kind==='heal'?'magic':actor.kind,heavy=actor.mp>=32&&(tactic==='assault'||actor.actions%3===0),cost=heavy?32:actor.mp>=12?12:0,power=heavy?2.6:cost?1.35:1,name=heavy?'결정의 일격':cost?'연속 타격':'기본 공격';
 if(kind==='ranged')name=heavy?'관통 사격':cost?'정밀 사격':'사격';if(kind==='magic')name=heavy?'별빛 붕괴':cost?'마력탄':'마력 투사';
 const hurt=[...alive(friends)].sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];if(actor.kind==='heal'&&hurt.hp/hurt.maxHp<(tactic==='guard'?.86:.7)&&actor.mp>=12){kind='heal';target=hurt;heavy=hurt.hp/hurt.maxHp<.36&&actor.mp>=32;cost=heavy?32:12;power=heavy?3:1.8;name=heavy?'생명의 기도':'미광 치유';}
 if(tactic==='guard'&&kind!=='heal'&&cost===32){heavy=false;cost=12;power=1.35;name=kind==='magic'?'마력탄':kind==='ranged'?'정밀 사격':'연속 타격';}
 actor.mp=Math.max(0,actor.mp-cost);actor.next=b.time+100/actor.speed;actor.actions++;
 const protectedRear=kind!=='heal'&&isRear(target)&&alive(foes).some(c=>!isRear(c)),rearRanged=isRear(actor)&&['ranged','magic'].includes(kind),rearMelee=isRear(actor)&&kind==='melee';
 const miss=kind!=='heal'&&random()>(rearRanged?.99:.95),crit=kind!=='heal'&&random()<.13;
 const modifier=(protectedRear?.8:1)*(rearRanged?1.15:1)*(rearMelee?.8:1)*(target.side==='ally'&&b.tactic==='guard'?.82:1);
 const value=kind==='heal'?Math.round(actor.atk*power):Math.max(1,Math.round(actor.atk*power*100/(100+target.def*2)*modifier*(crit?1.5:1)*(.94+random()*.12)));
 const e={id:++b.serial,actor:actor.id,target:target.id,kind,heavy,cost,name,miss,crit,value,protectedRear,rearBonus:rearRanged};b.pending=e;return e;
}
export function resolveAction(b,event){
 if(b.phase!=='fighting'||!b.pending||b.pending!==event)return false;const target=[...b.allies,...b.enemies].find(c=>c.id===event.target);if(!target)return false;
 if(!event.miss)target.hp=event.kind==='heal'?Math.min(target.maxHp,target.hp+event.value):Math.max(0,target.hp-event.value);
 b.pending=null;b.turn++;b.metrics[event.kind]++;if(event.heavy)b.metrics.heavy++;if(event.miss)b.metrics.miss++;if(event.protectedRear)b.metrics.protected++;
 const actor=[...b.allies,...b.enemies].find(c=>c.id===event.actor);b.log.unshift(`${actor.name} · ${event.name} → ${target.name} · ${event.miss?'회피':event.kind==='heal'?'회복 +'+event.value:event.value+(event.crit?' 치명타':'')}`);b.log.length=Math.min(12,b.log.length);
 if(!alive(b.enemies).length)b.phase='won';else if(!alive(b.allies).length)b.phase='lost';else if(b.turn>=300)b.phase='timeout';return true;
}
