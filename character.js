// Innate identity is independent of appearance settings, class and reincarnation.
export const APPEARANCE_VARIANTS = Object.freeze([
 {id:'original',name:'원래의 배색',color:'#b5a187',hue:null,saturation:.45,shade:1},
 {id:'moss',name:'이끼빛 원정복',color:'#647956',hue:95,saturation:.4,shade:.92},
 {id:'navy',name:'밤바다 원정복',color:'#566984',hue:215,saturation:.42,shade:.9},
 {id:'wine',name:'포도주빛 원정복',color:'#925765',hue:345,saturation:.43,shade:.95},
 {id:'plum',name:'자두빛 원정복',color:'#81618c',hue:280,saturation:.36,shade:.98},
 {id:'ochre',name:'황토빛 원정복',color:'#a58b57',hue:40,saturation:.46,shade:1.02},
 {id:'slate',name:'잿빛 원정복',color:'#758189',hue:205,saturation:.16,shade:.94},
 {id:'teal',name:'청록빛 원정복',color:'#588b86',hue:175,saturation:.36,shade:.96}
]);
export const TRAITS = {
 gender:['여성','남성'],personality:['신중한','명랑한','무뚝뚝한','온화한','과묵한','장난기 많은','솔직한','낙천적인','호쾌한'],
 build:['늘씬한 체형','탄탄한 체형','균형 잡힌 체형','풍만한 체형','다부진 체형'],
 bust:['작은 편','보통','큰 편','해당 없음'],temperament:['계획형','직감형','탐구형','보호형','도전형','관찰형'],
 values:['약속을 중시','자유를 중시','가족을 중시','지식을 중시','공정함을 중시','동료를 중시'],
 romance:['오랜 신뢰를 쌓는 편','솔직한 표현을 좋아함','함께하는 시간을 중시','서로의 공간을 존중'],
 likes:['따뜻한 차','책','꽃','수제 요리','여행 기념품']
};
export const TALENTS = [
 {id:'steady',name:'침착한 수호',desc:'양 방어력 +8% · 물리·마법 공격 −3%',attack:.97,defense:1.08,critical:0,healing:1},
 {id:'scholar',name:'마력의 이해',desc:'물리·마법 공격 +6% · 양 방어력 −4%',attack:1.06,defense:.96,critical:0,healing:1},
 {id:'keen',name:'예리한 감각',desc:'치명타 확률 +7%p',attack:1,defense:1,critical:.07,healing:1},
 {id:'kind',name:'치유의 손길',desc:'치유량 +15%',attack:1,defense:1,critical:0,healing:1.15},
 {id:'brave',name:'불굴의 의지',desc:'양 방어력 +5%',attack:1,defense:1.05,critical:0,healing:1},
 {id:'agile',name:'결정적 일격',desc:'물리·마법 공격 +3% · 치명타 확률 +3%p',attack:1.03,defense:1,critical:.03,healing:1},
 {id:'veteran',name:'노련한 전사',desc:'물리·마법 공격 +4% · 양 방어력 +2%',attack:1.04,defense:1.02,critical:0,healing:1}
];
const named = {
 elina:{gender:0,personality:0,build:0,bust:1,height:171,temperament:0,values:0,romance:0,likes:0,dislikes:4,talent:'steady',palette:'teal'},
 rune:{gender:0,personality:1,build:2,bust:0,height:163,temperament:2,values:3,romance:3,likes:1,dislikes:2,talent:'scholar',palette:'plum'},
 kyle:{gender:1,personality:2,build:1,bust:3,height:183,temperament:5,values:1,romance:2,likes:4,dislikes:0,talent:'keen',palette:'moss'},
 recruit0:{gender:0,personality:3,build:3,bust:2,height:168,temperament:3,values:2,romance:0,likes:2,dislikes:4,talent:'kind',palette:'original'},
 recruit1:{gender:1,personality:4,build:4,bust:3,height:188,temperament:0,values:5,romance:2,likes:3,dislikes:1,talent:'brave',palette:'navy'},
 recruit2:{gender:0,personality:5,build:0,bust:0,height:166,temperament:1,values:1,romance:1,likes:4,dislikes:2,talent:'agile',palette:'slate'},
 recruit3:{gender:1,personality:8,build:4,bust:3,height:179,temperament:4,values:4,romance:1,likes:0,dislikes:3,talent:'veteran',palette:'wine'},
 recruit4:{gender:0,personality:8,build:2,bust:1,height:169,temperament:4,values:1,romance:1,likes:3,dislikes:1,talent:'scholar',palette:'wine'},
 recruit5:{gender:0,personality:4,build:1,bust:1,height:174,temperament:5,values:0,romance:0,likes:1,dislikes:4,talent:'steady',palette:'plum'},
 recruit6:{gender:0,personality:0,build:0,bust:0,height:164,temperament:0,values:4,romance:3,likes:0,dislikes:2,talent:'agile',palette:'navy'},
 recruit7:{gender:1,personality:7,build:1,bust:3,height:181,temperament:1,values:5,romance:2,likes:4,dislikes:1,talent:'keen',palette:'ochre'},
 recruit8:{gender:0,personality:1,build:2,bust:1,height:167,temperament:3,values:2,romance:2,likes:2,dislikes:0,talent:'kind',palette:'original'},
 recruit9:{gender:0,personality:5,build:0,bust:0,height:162,temperament:5,values:1,romance:3,likes:3,dislikes:4,talent:'agile',palette:'navy'}
};
function hash(id){let n=2166136261;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function createIdentity(id){
 const fixed=named[id];if(fixed){const {palette,...identity}=fixed;return {...identity};}
 let seed=hash(id);const pick=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const gender=pick(2),likes=pick(5);
 return {gender,personality:pick(TRAITS.personality.length),build:pick(5),bust:gender===1?3:pick(3),height:155+pick(36),temperament:pick(6),values:pick(6),romance:pick(4),likes,dislikes:(likes+1+pick(4))%5,talent:TALENTS[pick(TALENTS.length)].id};
}
export function createAppearance(id){const variant=named[id]?.palette||APPEARANCE_VARIANTS[hash(id)%APPEARANCE_VARIANTS.length].id;return {version:2,variant};}
export function appearanceOf(c){const a=c.appearance||createAppearance(c.id||'');return APPEARANCE_VARIANTS.find(v=>v.id===a.variant)||APPEARANCE_VARIANTS[0];}
export function normalizeAppearance(c){
 if(c.appearance===undefined){c.appearance=createAppearance(c.id);return;}
 const a=c.appearance;
 if(a&&a.version===undefined&&typeof a.palette==='string'&&['original','ember','forest','ocean','violet','rose','silver','antique','custom'].includes(a.palette)&&[['hue',0,360],['saturation',0,180],['brightness',70,130]].every(([k,min,max])=>Number.isInteger(a[k])&&a[k]>=min&&a[k]<=max)){
  c.appearance=createAppearance(c.id);return;
 }
 if(!validateAppearance(a))throw Error('외형 바리에이션 정보가 올바르지 않습니다.');
 // Appearance is authored at creation, not a save-file-controlled hue filter.
 c.appearance=createAppearance(c.id);
}
export function talentOf(c){return TALENTS.find(t=>t.id===(c.identity||createIdentity(c.id)).talent)||TALENTS[0];}
export function validateIdentity(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 for(const [key,values] of Object.entries(TRAITS)){if(!Number.isInteger(value[key])||value[key]<0||value[key]>=values.length)return false;}
 return Number.isInteger(value.dislikes)&&value.dislikes>=0&&value.dislikes<5&&value.dislikes!==value.likes&&Number.isInteger(value.height)&&value.height>=145&&value.height<=210&&TALENTS.some(t=>t.id===value.talent)&&!(value.gender===1&&value.bust!==3);
}
export function validateAppearance(a){return !!a&&typeof a==='object'&&!Array.isArray(a)&&a.version===2&&APPEARANCE_VARIANTS.some(v=>v.id===a.variant)&&Object.keys(a).every(k=>['version','variant'].includes(k));}
export const personalityLine = c => [
 '“확실하게 준비하고, 함께 나아가요.”','“다음 길에는 어떤 일이 기다릴까요?”','“말보다 행동으로 보여주지.”','“돌아오면 따뜻한 차를 마셔요.”',
 '“곁을 지키는 데 긴 말은 필요 없지.”','“오늘은 내가 먼저 보물을 찾을 거예요.”','“믿는 건 분명하게 말하는 게 좋아.”','“내일은 오늘보다 괜찮을 거예요.”','“한 방에 끝내자고! 시원하게!”'
 ][c.identity.personality];
