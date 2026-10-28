import {battleState as freshState} from './fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newHero,stats,tick,startBattle,serialize,restore,rebirth,rollItem,equipItem,setBaseWeapon,setTactics,offline} from '../engine.js';
import {actionsFor,chooseAction,damageAmount,hitChance,stepCombat,weaponFor,masteryOf,gainMastery,MASTERY_MAX_XP,WEAPONS,turnOrder} from '../combat.js';

function singleMage(){const s=freshState();s.party=['rune'];startBattle(s);const c=s.heroes[1];c.nextAct=0;return {s,c};}
function targets(){return [{enemy:true,id:0,name:'표적',hp:100000,maxHp:100000,atk:10,matk:10,def:20,mdef:20,accuracy:90,evasion:0,level:1}];}

test('physical and magical defense mitigate only their own damage type',()=>{
 const attacker={atk:100,matk:140,level:5},defender={def:10,mdef:10};
 const physical={type:'physical',power:1},magic={type:'magic',power:1};
 assert.ok(damageAmount(attacker,{...defender,def:100},physical)<damageAmount(attacker,defender,physical));
 assert.equal(damageAmount(attacker,{...defender,mdef:100},physical),damageAmount(attacker,defender,physical));
 assert.ok(damageAmount(attacker,{...defender,mdef:100},magic)<damageAmount(attacker,defender,magic));
 assert.equal(damageAmount(attacker,{...defender,def:100},magic),damageAmount(attacker,defender,magic));
 assert.ok(damageAmount(attacker,defender,magic,{critical:true})>damageAmount(attacker,defender,magic));
});
test('hit and evasion use bounded probabilities; magic has an accuracy advantage',()=>{
 assert.equal(hitChance({accuracy:90},{evasion:20}),.7);
 assert.equal(hitChance({accuracy:90},{evasion:20},'magic'),.75);
 assert.equal(hitChance({accuracy:0},{evasion:100}),.1);
 assert.equal(hitChance({accuracy:200},{evasion:0}),.995);
});
test('a miss consumes MP and grants practice but never changes target health',()=>{
 const {s,c}=singleMage();c.mp=20;c.tactics='efficient';const hp=s.battle.enemies.map(e=>e.hp),mp=c.mp;
 const event=stepCombat(s,()=>.9999);assert.equal(event.kind,'miss');assert.equal(event.actionId,'weak');assert.equal(c.mp,mp-event.manaCost);
 assert.deepEqual(s.battle.enemies.map(e=>e.hp),hp);assert.equal(c.mastery.staff,2);
});
test('speed schedules repeated turns without enforcing alternating sides',()=>{
 const s=freshState();const slow=newHero('slow','느린 검사','swordsman',0,'A'),fast=newHero('fast','빠른 도적','thief',0,'A');s.heroes=[slow,fast];s.party=['slow','fast'];startBattle(s);
 slow.hp=fast.hp=1000000;s.battle.enemies=s.battle.enemies.slice(0,1);s.battle.enemies[0].hp=1000000;
 const counts={slow:0,fast:0};for(let i=0;i<500;i++){const event=stepCombat(s,()=>.5);if(Object.hasOwn(counts,event.source)&&!event.actorEnemy)counts[event.source]++;}
 assert.ok(stats(fast).speed>stats(slow).speed);assert.ok(counts.fast>counts.slow,JSON.stringify(counts));
});
test('initiative preview is pure and matches the next scheduled actor',()=>{
 const s=freshState(),before=serialize(s,1),queue=turnOrder(s,8);assert.equal(serialize(s,1),before);
 const event=stepCombat(s,()=>.5);assert.equal(queue[0].id,event.source);assert.equal(queue[0].enemy,event.actorEnemy);
});
test('all living units regenerate mana with shared elapsed battle time',()=>{
 const s=freshState();for(const c of s.heroes)c.mp=0;for(const e of s.battle.enemies)e.mp=0;
 const event=stepCombat(s,()=>.5);assert.ok(event.elapsed>0);
 for(const c of s.heroes)assert.ok(c.mp>0);for(const e of s.battle.enemies)assert.ok(e.mp>0);
});
test('pause and manual mode freeze MP, initiative and cooldowns',()=>{
 for(const key of ['paused','auto']){const s=freshState();if(key==='paused')s.paused=true;else s.auto=false;const before=serialize(s,10);for(let i=0;i<50;i++)assert.equal(tick(s),null);assert.equal(serialize(s,10),before);}
});
test('hearty mage banks mana for strong spells, cheerful mage casts weak spells',()=>{
 const {c}=singleMage(),enemies=targets();c.identity.personality=8;c.mp=20;
 assert.equal(chooseAction(c,[c],enemies).action.id,'basic');
 c.identity.personality=1;assert.equal(chooseAction(c,[c],enemies).action.id,'weak');
 c.identity.personality=8;c.mp=40;assert.equal(chooseAction(c,[c],enemies).action.id,'strong');
 const [basic,weak,strong]=actionsFor(c);assert.ok(strong.cost>weak.cost);assert.ok(strong.power>weak.power);assert.equal(basic.cost,0);
});
test('insufficient mana falls back to a free attack without negative MP',()=>{
 const {s,c}=singleMage();c.mp=0;c.identity.personality=8;const event=stepCombat(s,()=>.1);
 assert.equal(event.actionId,'basic');assert.equal(event.manaCost,0);assert.equal(c.mp,0);
});
test('healer uses weaker or stronger healing according to danger and available MP',()=>{
 const c=newHero('healer','치유사','priest',3,'S');c.identity.personality=3;c.hp=stats(c).maxHp*.2;c.mp=40;
 assert.equal(chooseAction(c,[c],targets()).action.id,'strong');c.mp=15;assert.equal(chooseAction(c,[c],targets()).action.id,'weak');c.mp=0;assert.equal(chooseAction(c,[c],targets()).action.id,'basic');
});
test('weapon mastery is independent by type, increases stats and retains through rebirth',()=>{
 const s=freshState(),c=s.heroes[0],before=stats(c);gainMastery(c,2000);assert.equal(masteryOf(c),10);assert.ok(stats(c).atk>before.atk);
 assert.ok(setBaseWeapon(s,c.id,'bow'));assert.equal(masteryOf(c),0);assert.equal(c.mastery.sword,2000);
 assert.ok(setBaseWeapon(s,c.id,'sword'));c.level=30;const mastery=structuredClone(c.mastery);assert.ok(rebirth(s,c.id));assert.deepEqual(c.mastery,mastery);
 gainMastery(c,MASTERY_MAX_XP*10);assert.equal(masteryOf(c),1000);assert.equal(c.mastery.sword,MASTERY_MAX_XP);
});
test('spellcasting weapon mastery reduces mana costs with a 20% limit',()=>{
 const {c}=singleMage();const before=actionsFor(c)[2].cost;gainMastery(c,MASTERY_MAX_XP);const after=actionsFor(c)[2].cost;
 assert.ok(after<before);assert.ok(after>=Math.ceil(before*.8));
});
test('equipped weapon overrides basic weapon; old item names migrate to types',()=>{
 const s=freshState(),c=s.heroes[0],item=rollItem(s,()=>.2);assert.equal(item.weaponType,'staff');equipItem(s,c.id,item.id);setBaseWeapon(s,c.id,'dagger');assert.equal(weaponFor(c).id,'staff');
 delete item.weaponType;const old=restore(serialize(s)).state;assert.equal(old.inventory[0].weaponType,'staff');assert.equal(weaponFor(old.heroes[0]).id,'staff');
});
test('legacy saves receive mastery and tactics while existing progression survives',()=>{
 const s=freshState(100000);s.gold=1500;for(const c of s.heroes){delete c.mastery;delete c.baseWeapon;delete c.tactics;}
 const loaded=restore(serialize(s,100000),100000).state;assert.equal(loaded.gold,1500);for(const c of loaded.heroes){assert.equal(Object.keys(c.mastery).length,WEAPONS.length);assert.equal(c.tactics,'personality');}
 gainMastery(loaded.heroes[0],500);setTactics(loaded,loaded.heroes[0].id,'burst');const roundtrip=restore(serialize(loaded,100000),100000).state;
 assert.deepEqual(roundtrip.heroes[0].mastery,loaded.heroes[0].mastery);assert.equal(roundtrip.heroes[0].tactics,'burst');
});
test('invalid mastery, weapon types and tactics are rejected when importing',()=>{
 for(const value of [null,[],{sword:-1},{sword:NaN},{sword:MASTERY_MAX_XP+1},{unknown:0}]){const s=freshState();s.heroes[0].mastery=value;assert.throws(()=>restore(serialize(s)));}
 for(const [field,value] of [['baseWeapon','<svg>'],['tactics','unknown']]){const s=freshState();s.heroes[0][field]=value;assert.throws(()=>restore(serialize(s)));}
 const s=freshState(),i=rollItem(s,()=>.2);i.weaponType='bad';assert.throws(()=>restore(serialize(s)));
});
test('offline practice is capped together with offline rewards',()=>{
 const s=freshState(),before=s.heroes[0].mastery.sword,r=offline(s,3600);assert.ok(r.mastery>0);assert.equal(s.heroes[0].mastery.sword,before+r.mastery);
});
