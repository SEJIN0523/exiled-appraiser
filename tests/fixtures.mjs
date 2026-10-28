import {freshState,newHero,startBattle} from '../engine.js';
import {defaultFormation} from '../formation.js';
// Existing combat/progression regression cases use a prepared, active expedition.
export function battleState(now=Date.now()){
 const s=freshState(now);s.gold=800;s.gems=120;s.heroes=[newHero('elina','엘리나','swordsman',3,'S',27,3),newHero('rune','루네','mage',3,'A',25,2),newHero('kyle','카일','archer',0,'A',31,2)];s.party=s.heroes.map(c=>c.id);s.formation=defaultFormation(s.heroes,s.party);s.opening={step:5,offer:null,completed:true};s.expeditionActive=true;startBattle(s);return s;
}
