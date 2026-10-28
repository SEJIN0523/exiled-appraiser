import {BattleScene} from './battle-scene.js';
import {ROSTER,DEFAULT_FORMATION,TACTICS,validFormation,assign,unassign,alive,isRear} from './battle-model.js';
const $=s=>document.querySelector(s);
let scene,formation=[...DEFAULT_FORMATION],draft=[...formation],selectedHero=null,selectedSlot=0,game;
function setText(id,text){$(id).textContent=text;}
function update(b,perf){
 const labels={ready:'원정대 준비',fighting:'자동 전투 중',won:'전투 승리',lost:'원정대 전멸',retreated:'도주 완료',timeout:'모의전 종료'};
 setText('#phase-label',labels[b.phase]);setText('#turn-label',b.phase==='fighting'?'ACTION '+String(b.turn+1).padStart(2,'0'):'AUTO BATTLE');
 setText('#ally-count',alive(b.allies).length+' / '+b.allies.length);setText('#enemy-count',alive(b.enemies).length+' / '+b.enemies.length);
 for(const [key,team] of [['ally',b.allies],['enemy',b.enemies]])$('#'+key+'-bar').style.width=100*team.reduce((n,c)=>n+c.hp,0)/team.reduce((n,c)=>n+c.maxHp,0)+'%';
 const last=b.log[0];setText('#action-caption',last||'전위 4 · 후위 4 위치 중 최대 5명 출진');
 setText('#performance',(perf.fps||'—')+' FPS · FX '+perf.effects);
 $('#flee').disabled=b.phase!=='fighting';for(const button of document.querySelectorAll('[data-tactic]')){const selected=button.dataset.tactic===b.tactic;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
 setText('#tactic-hint',TACTICS[b.tactic].desc);
 setText('#unit-status',[...b.allies,...b.enemies].map(c=>`${c.name} ${c.side==='ally'?'아군':'적군'} ${isRear(c)?'후위':'전위'} 체력 ${Math.ceil(c.hp)} / ${c.maxHp}, 마나 ${Math.floor(c.mp)} / ${c.maxMp}`).join('. '));
}
function result(b){const copy={won:['VICTORY','숲길을 열었습니다.'],lost:['RETREAT','전열을 다시 정비하세요.'],retreated:['WITHDRAWN','안전하게 전장을 벗어났습니다.'],timeout:['FIELD TEST COMPLETE','모의전을 마쳤습니다.']},[tag,title]=copy[b.phase]||copy.timeout;
 $('#stage-overlay').innerHTML=`<div class="briefing"><small>${tag}</small><h2>${title}</h2><p>공격과 기술을 모두 자동으로 사용했습니다.<br>전술과 배치를 바꿔 차이를 확인해 보세요.</p><div class="result-metrics">${[['근접',b.metrics.melee],['사격',b.metrics.ranged],['마법',b.metrics.magic],['치유',b.metrics.heal],['강타',b.metrics.heavy],['후위 보호',b.metrics.protected]].map(([k,n])=>`<div><small>${k}</small><b>${n}</b></div>`).join('')}</div><button class="primary" data-command="retry">같은 편성으로 다시 출발</button><button class="result-button" data-command="formation">원정대 재편성</button></div>`;$('#stage-overlay').classList.remove('hidden');
}
function openFormation(){if(!scene||scene.b.phase==='fighting')return;draft=[...formation];selectedHero=null;selectedSlot=0;drawFormation();$('#formation-dialog').showModal();}
function drawFormation(message=''){const dialog=$('#formation-dialog');dialog.innerHTML=`<button class="dialog-close" data-close="formation-dialog" aria-label="닫기">×</button><div class="formation-top"><h2 id="formation-title">원정대 편성</h2><span>${draft.filter(Boolean).length} / 5 출진</span></div><p class="formation-instruction">① 자리 선택 → ② 동료 선택 → ③ 배치<br>자리나 다른 동료를 눌러도 자동 이동하지 않습니다.</p><div class="formation-head"><span>후위 · 원거리 유리</span><span>전위 · 적의 접근 저지</span></div><div class="formation-board">${Array.from({length:8},(_,n)=>{const slot=n%2===0?4+Math.floor(n/2):Math.floor(n/2),u=ROSTER.find(c=>c.id===draft[slot]);return `<button class="formation-slot ${slot===selectedSlot?'chosen':''}" data-slot="${slot}" aria-pressed="${slot===selectedSlot}"><span><small>${slot>=4?'후위':'전위'} ${slot%4+1}</small><br>${u?u.name:'빈 자리'}</span>${u?`<img src="./assets/${u.id}.webp" alt="">`:'＋'}</button>`;}).join('')}</div><div class="draft-roster">${ROSTER.map(c=>`<button class="draft-person ${c.id===selectedHero?'chosen':''} ${draft.includes(c.id)?'deployed':''}" data-unit="${c.id}" aria-pressed="${c.id===selectedHero}"><b>${c.name}</b><small>${c.role} · ${draft.includes(c.id)?'배치 중':'대기'}</small></button>`).join('')}</div><div class="draft-actions"><button data-draft="assign" ${!selectedHero?'disabled':''}>${selectedHero?ROSTER.find(c=>c.id===selectedHero).name+' 배치':'동료를 선택하세요'}</button><button data-draft="remove" ${!draft[selectedSlot]||draft.filter(Boolean).length===1?'disabled':''}>선택 자리 비우기</button><button class="primary" data-draft="apply">이 편성으로 준비</button></div><p class="draft-message" aria-live="polite">${message||'후위는 원거리 피해 +15% · 전위 생존 시 피해 −20%'}</p>`;}
async function boot(){try{
 const response=await fetch('./assets/metadata.json');if(!response.ok)throw Error('원화 메타데이터를 불러오지 못했습니다.');const metadata=await response.json();
 const battleScene=new BattleScene({metadata,onReady:s=>{scene=s;$('#begin').disabled=false;setText('#begin','모의전 입장');},onUpdate:update,onFinish:result});
 game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:$('#game').clientWidth,height:$('#game').clientHeight,backgroundColor:'#24362d',transparent:false,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,roundPixels:false,powerPreference:'low-power'},fps:{target:60,limit:60,forceSetTimeOut:false},scene:[battleScene],audio:{noAudio:true}});
 window.addEventListener('pagehide',()=>{scene?.flee();game?.destroy(true);},{once:true});
 }catch(error){$('#stage-overlay').innerHTML='<div class="error-box">전투 화면을 불러오지 못했습니다.<br>README의 실행 방법을 확인하고 새로고침해 주세요.</div>';console.error(error);}}
document.addEventListener('click',e=>{
 const tactic=e.target.closest('[data-tactic]');if(tactic&&scene){scene.setTactic(tactic.dataset.tactic);return;}
 const close=e.target.closest('[data-close]');if(close){$('#'+close.dataset.close).close();return;}
 if(e.target.closest('#begin')&&scene){$('#stage-overlay').classList.add('hidden');scene.begin();return;}
 if(e.target.closest('#flee')){scene?.flee();return;}
 if(e.target.closest('#open-formation')||e.target.closest('[data-command="formation"]')){openFormation();return;}
 if(e.target.closest('#open-notes')){$('#notes-dialog').showModal();return;}
 if(e.target.closest('[data-command="retry"]')&&scene){scene.prepare(formation);$('#stage-overlay').classList.add('hidden');scene.begin();return;}
 const slot=e.target.closest('[data-slot]');if(slot){selectedSlot=Number(slot.dataset.slot);drawFormation();return;}
 const unit=e.target.closest('[data-unit]');if(unit){selectedHero=unit.dataset.unit;drawFormation();return;}
 const action=e.target.closest('[data-draft]')?.dataset.draft;
 if(action==='assign'){const next=assign(draft,selectedHero,selectedSlot);if(next){draft=next;selectedHero=null;drawFormation('배치를 반영했습니다. 다른 동료를 선택할 수 있습니다.');}else drawFormation('최대 5명입니다. 빈 자리를 만들거나 기존 동료의 자리를 선택하세요.');}
 if(action==='remove'){const next=unassign(draft,selectedSlot);if(next){draft=next;selectedHero=null;drawFormation('대기 명단으로 이동했습니다.');}}
 if(action==='apply'&&scene&&validFormation(draft)){formation=[...draft];scene.prepare(formation);$('#formation-dialog').close();$('#stage-overlay').innerHTML='<div class="briefing"><small>FORMATION READY</small><h2>원정대 준비 완료</h2><p>전위와 후위의 차이를 확인해 보세요.<br>모든 공격·기술은 자동으로 진행됩니다.</p><button id="begin" class="primary">모의전 입장</button><div class="briefing-links"><button id="open-formation">원정대 편성</button><span>·</span><button id="open-notes">설계 검토</button></div></div>';$('#stage-overlay').classList.remove('hidden');}
});
boot();
