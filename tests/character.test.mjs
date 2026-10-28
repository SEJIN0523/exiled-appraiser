import {battleState as freshState} from './fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createIdentity,createAppearance,validateIdentity,validateAppearance,APPEARANCE_VARIANTS,talentOf} from '../character.js';
import {stats,recruit,relationship,serialize,restore,changeJob,rebirth,tick,startBattle} from '../engine.js';

const roster=['elina','rune','kyle','recruit0','recruit1','recruit2','recruit3','recruit4','recruit5','recruit6','recruit7','recruit8','recruit9'];
test('every named adult has a distinct valid permanent identity',()=>{
 const identities=roster.map(createIdentity);
 assert.equal(new Set(identities.map(JSON.stringify)).size,roster.length);
 for(const [i,id] of roster.entries()){assert.ok(validateIdentity(identities[i]));assert.ok(validateAppearance(createAppearance(id)));assert.deepEqual(createIdentity(id),identities[i]);}
 for(let n=0;n<50;n++)assert.ok(validateIdentity(createIdentity('future-'+n)));
 const a=createIdentity('elina');a.height=200;assert.equal(createIdentity('elina').height,171);
});
test('fixed appearance is deterministic, independent of stats and cannot be replaced by a hue filter',()=>{
 const s=freshState(),c=s.heroes[0],before=stats(c),identity=structuredClone(c.identity);
 const look=createAppearance(c.id);assert.ok(APPEARANCE_VARIANTS.some(v=>v.id===look.variant));assert.deepEqual(createAppearance(c.id),look);
 const loaded=restore(serialize(s)).state;assert.deepEqual(stats(loaded.heroes[0]),before);assert.deepEqual(loaded.heroes[0].identity,identity);
 assert.equal('hue' in c.appearance,false);assert.equal('palette' in c.appearance,false);
});

test('recruits keep their preview identity and palette',()=>{
 const s=freshState();s.gold=10000;
 for(let i=0;i<10;i++){assert.ok(recruit(s,i));const c=s.heroes.at(-1);assert.deepEqual(c.identity,createIdentity('recruit'+i));assert.deepEqual(c.appearance,createAppearance('recruit'+i));assert.ok(c.age>=20);}
});
test('old saves migrate without losing progress and migration is stable',()=>{
 const s=freshState(100000);s.gold=1234;s.heroes[0].level=15;
 for(const c of s.heroes){delete c.identity;delete c.appearance;}
 const a=restore(serialize(s,100000),100000).state,b=restore(serialize(s,100000),100000).state;
 assert.equal(a.gold,1234);assert.equal(a.heroes[0].level,15);assert.deepEqual(a.heroes.map(c=>c.identity),b.heroes.map(c=>c.identity));
 a.heroes[0].appearance={palette:'custom',hue:133,saturation:78,brightness:100};
 const loaded=restore(serialize(a,100000),100000).state;
 assert.deepEqual(loaded.heroes[0].appearance,createAppearance('elina'));assert.deepEqual(loaded.heroes[0].identity,a.heroes[0].identity);
});
test('malformed imported trait and appearance fields are rejected',()=>{
 for(const bad of [null,{}, {palette:'custom',hue:'0);color:red',saturation:100,brightness:100},{palette:'custom',hue:0,saturation:100,brightness:900}]){const s=freshState();s.heroes[0].appearance=bad;assert.throws(()=>restore(serialize(s)));}
 for(const [key,bad] of [['height',20],['bust',999],['talent','<script>'],['likes',-1],['personality',.5]]){const s=freshState();s.heroes[0].identity[key]=bad;assert.throws(()=>restore(serialize(s)));}
});
test('favorite, neutral and disliked gifts produce individual trust responses',()=>{
 for(const [kind,expected] of [['likes',15],['neutral',10],['dislikes',5]]){const s=freshState(),c=s.heroes[0];const value=kind==='neutral'?-1:c.identity[kind];assert.ok(relationship(s,c.id,'gift',value));assert.equal(c.bond,expected);assert.equal(s.gold,700);}
});
test('identity, cosmetic color and talents survive class changes and rebirth',()=>{
 const s=freshState(),c=s.heroes[0];s.gold=10000;c.level=30;const identity=structuredClone(c.identity),appearance=structuredClone(c.appearance);
 assert.ok(changeJob(s,c.id,'knight'));assert.ok(rebirth(s,c.id));assert.deepEqual(c.identity,identity);assert.deepEqual(c.appearance,appearance);assert.equal(talentOf(c).id,'steady');
});
test('combat traits change critical chance and healing output',()=>{
 const a=freshState(),b=freshState();for(const s of [a,b]){s.party=['kyle'];s.heroes.find(c=>c.id==='kyle').identity.talent=s===a?'keen':'brave';startBattle(s);}
 assert.equal(tick(a,()=>.2).crit,true);assert.equal(tick(b,()=>.2).crit,false);
 const healing=[];
 for(const talent of ['kind','brave']){const c=freshState();c.gold=1000;recruit(c,0);const healer=c.heroes.at(-1);healer.identity.talent=talent;c.party=[healer.id];startBattle(c);healer.hp=1;healer.nextAct=0;healer.mp=15;const event=tick(c,()=>0);assert.equal(event.kind,'heal');healing.push(event.value);}
 assert.ok(healing[0]>healing[1]);
});
