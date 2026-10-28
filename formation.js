import {job} from './data.js';
export const SLOT_COUNT=8,MAX_DEPLOYED=5;
export const rowOf=slot=>Number.isInteger(slot)&&slot>=4?'rear':'front';
export const slotLabel=slot=>(rowOf(slot)==='front'?'전위 ':'후위 ')+(slot%4+1);
export function defaultFormation(heroes,party){
 const slots=Array(8).fill(null);
 for(const id of party){const c=heroes.find(c=>c.id===id);if(!c)continue;const rear=['마법','치유'].includes(job(c.job).role)||/archer|ranger|hunter|hawkeye/.test(c.job);const order=rear?[4,5,6,7,0,1,2,3]:[0,1,2,3,4,5,6,7];const index=order.find(i=>slots[i]===null);if(index!==undefined)slots[index]=id;}
 return slots;
}
export function validFormation(slots,heroes,party){
 if(!Array.isArray(slots)||slots.length!==8)return false;
 const ids=slots.filter(id=>id!==null);return ids.length<=5&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&heroes.some(c=>c.id===id))&&ids.length===party.length&&ids.every(id=>party.includes(id));
}
export function reconcileFormation(s){if(!validFormation(s.formation,s.heroes,s.party))s.formation=defaultFormation(s.heroes,s.party);}
export function placeHero(s,id,slot){
 if(s.expeditionActive||!s.heroes.some(c=>c.id===id)||!Number.isInteger(slot)||slot<0||slot>=8)return false;
 reconcileFormation(s);const old=s.formation.indexOf(id),target=s.formation[slot];
 if(old<0&&target===null&&s.party.length>=5)return false;
 const next=[...s.formation];if(old>=0)next[old]=target;next[slot]=id;
 s.formation=next;s.party=next.filter(Boolean);return true;
}
export function removeHero(s,id){if(s.expeditionActive)return false;reconcileFormation(s);s.formation=s.formation.map(v=>v===id?null:v);s.party=s.formation.filter(Boolean);return true;}
export function frontTargets(units){const front=units.filter(c=>c.hp>0&&rowOf(c.battleSlot)==='front');return front.length?front:units.filter(c=>c.hp>0);}
