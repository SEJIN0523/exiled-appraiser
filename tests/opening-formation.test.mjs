import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,advanceOpening,firstOfferHero,buyFirstCompanion,beginExpedition,endExpedition,tick,serialize,restore,newHero,startBattle,changeJob,setFormation,unassignHero} from '../engine.js';
import {frontTargets,defaultFormation} from '../formation.js';
import {chooseAction} from '../combat.js';
import {validateIdentity} from '../character.js';
import {bustBounds} from '../portraits.js';
function purchased(random=()=>.4){const s=freshState();for(let i=0;i<4;i++)assert.equal(advanceOpening(s,random),true);assert.equal(buyFirstCompanion(s),true);return s;}
test('new game begins alone, has no money and cannot fight or earn offline rewards',()=>{const s=freshState(100000);assert.deepEqual(s.party,[]);assert.equal(s.heroes.length,0);assert.equal(s.gold,0);assert.equal(s.opening.step,0);assert.equal(beginExpedition(s),false);assert.equal(tick(s),null);const loaded=restore(serialize(s,100000),100000+3600000);assert.equal(loaded.reward,null);assert.equal(loaded.state.heroes.length,0);});
test('watch sale happens once and first adult female is purchased for 120 gold',()=>{for(const r of [0,.3,.6,.99]){const s=freshState();assert.equal(buyFirstCompanion(s),false);for(let i=0;i<4;i++)advanceOpening(s,()=>r);assert.equal(s.gold,800);const preview=firstOfferHero(s);assert.equal(preview.identity.gender,0);assert.ok(preview.age>=20);assert.ok(validateIdentity(preview.identity));assert.equal(advanceOpening(s),false);assert.equal(buyFirstCompanion(s),true);assert.equal(s.gold,680);assert.equal(s.heroes.length,1);assert.equal(s.heroes[0].outfit,'worn');assert.equal(s.expeditionActive,false);assert.equal(buyFirstCompanion(s),false);assert.equal(s.gold,680);assert.equal(restore(serialize(s)).state.party.length,1);}});
test('each opening page and randomized offer survives saving',()=>{const s=freshState();for(let step=0;step<5;step++){const restored=restore(serialize(s)).state;assert.equal(restored.opening.step,step);assert.deepEqual(restored.opening.offer,s.opening.offer);if(step<4)advanceOpening(s,()=>.6);}});
test('explicit expedition start and return gate combat',()=>{const s=purchased();assert.equal(tick(s),null);assert.equal(beginExpedition(s),true);assert.ok(tick(s,()=>.1));endExpedition(s);assert.equal(tick(s),null);});
test('eight formation slots accept five units; swap, bench and active locks are enforced',()=>{const s=purchased();for(let i=0;i<5;i++)s.heroes.push(newHero('extra'+i,'동료'+i,'swordsman',2,'A'));for(let i=0;i<4;i++)assert.equal(setFormation(s,'extra'+i,i+1),true);assert.equal(s.party.length,5);assert.equal(setFormation(s,'extra4',7),false);assert.equal(setFormation(s,'extra4',1),true);assert.equal(s.party.length,5);assert.ok(!s.party.includes('extra0'));const a=s.formation[0],b=s.formation[1];assert.equal(setFormation(s,a,1),true);assert.equal(s.formation[0],b);assert.equal(s.formation[1],a);beginExpedition(s);assert.equal(setFormation(s,a,6),false);assert.equal(unassignHero(s,a),false);endExpedition(s);assert.equal(unassignHero(s,a),true);assert.equal(s.party.length,4);assert.equal(restore(serialize(s)).state.formation.length,8);});
test('melee selects living front rank before vulnerable rear rank',()=>{const c=newHero('test','검사','swordsman',2,'A');c.mp=100;const front={enemy:true,id:0,hp:1000,battleSlot:0,atk:10,matk:10},rear={enemy:true,id:1,hp:1,battleSlot:4,atk:10,matk:10};assert.deepEqual(frontTargets([front,rear]),[front]);assert.equal(chooseAction(c,[c],[rear,front]).target.id,0);front.hp=0;assert.deepEqual(frontTargets([front,rear]),[rear]);});
test('first basic class is affordable at level one and worn full-body is retained',()=>{const s=purchased(),c=s.heroes[0];assert.equal(changeJob(s,c.id,'mage'),true);assert.equal(s.gold,560);assert.equal(c.outfit,'class');assert.equal(c.jobHistory[0].outfit,'worn');assert.equal(c.jobHistory[1].job,'mage');const loaded=restore(serialize(s)).state.heroes[0];assert.deepEqual(loaded.jobHistory,c.jobHistory);});
test('legacy save formation and job archive migrate without losing owned heroes',()=>{const s=purchased();delete s.formation;delete s.opening;delete s.expeditionActive;delete s.heroes[0].jobHistory;const loaded=restore(serialize(s)).state;assert.deepEqual(loaded.formation,defaultFormation(loaded.heroes,loaded.party));assert.equal(loaded.heroes[0].jobHistory.length,1);});
test('forged duplicate formation and invalid history imports are rejected',()=>{const s=purchased();s.formation[1]=s.party[0];assert.throws(()=>restore(serialize(s)));s.formation[1]=null;s.heroes[0].jobHistory[0].job='unknown';assert.throws(()=>restore(serialize(s)));});
test('bust frame preserves upper portrait and excludes lower body',()=>{const b=bustBounds(300,500,new Uint8ClampedArray(300*500*4));assert.equal(b.y,0);assert.equal(b.height,245);assert.ok(b.width<=300);assert.ok(b.x>=0);});
import {battleState} from './fixtures.mjs';
import {stepCombat} from '../combat.js';
test('living front protects rear units, and protection disappears when front falls',()=>{
 const base=battleState(),caster=base.heroes[1];caster.identity.personality=8;caster.nextAct=0;caster.mp=100;
 for(const c of base.heroes)if(c!==caster)c.nextAct=100;
 const front=base.battle.enemies[0];front.hp=9999;front.maxHp=9999;front.nextAct=100;
 base.battle.enemies.push({...front,id:1,hp:1000,maxHp:1000,battleSlot:4});
 const covered=structuredClone(base),exposed=structuredClone(base);exposed.battle.enemies[0].hp=0;
 const a=stepCombat(covered,()=>.5),b=stepCombat(exposed,()=>.5);
 assert.equal(a.target,1);assert.equal(b.target,1);assert.ok(Math.abs(a.value-Math.max(1,Math.floor(b.value*.8)))<=1);
});
test('rear melee is penalized while an allied front exists, then attacks at full strength',()=>{
 const base=battleState(),actor=base.heroes[0];actor.battleSlot=4;actor.nextAct=0;actor.mp=0;
 base.heroes[1].battleSlot=0;for(const c of base.heroes)if(c!==actor)c.nextAct=100;
 base.battle.enemies[0].nextAct=100;const covered=structuredClone(base),alone=structuredClone(base);alone.heroes[1].hp=0;
 const a=stepCombat(covered,()=>.5),b=stepCombat(alone,()=>.5);assert.ok(Math.abs(a.value-Math.max(1,Math.floor(b.value*.8)))<=1);
});
