export const JOBS = [
 ['swordsman','검사','공격',null],['knight','기사','수호','swordsman'],['swordsaint','검성','공격','knight'],
 ['warrior','전사','공격',null],['berserker','광전사','공격','warrior'],['warlord','군주','수호','berserker'],
 ['mage','마법사','마법',null],['elementalist','정령술사','마법','mage'],['archmage','대마법사','마법','elementalist'],
 ['archer','궁수','공격',null],['ranger','레인저','공격','archer'],['hawkeye','신궁','공격','ranger'],
 ['acolyte','수도자','치유',null],['priest','사제','치유','acolyte'],['highpriest','대사제','치유','priest'],
 ['thief','도적','공격',null],['assassin','암살자','공격','thief'],['nightblade','밤의 칼날','공격','assassin'],
 ['spearman','창병','공격',null],['halberdier','미늘창병','공격','spearman'],['dragoon','용기사','공격','halberdier'],
 ['monk','무투가','수호',null],['grandmaster','무극','수호','monk'],['paladin','성기사','수호','knight'],
 ['darkmage','흑마법사','마법','mage'],['warlock','마도사','마법','darkmage'],['necromancer','강령술사','마법','warlock'],
 ['hunter','사냥꾼','공격',null],['monsterhunter','마수사냥꾼','공격','hunter'],['druid','드루이드','치유','hunter'],
 ['bard','음유시인','치유',null],['alchemist','연금술사','마법',null],['summoner','소환사','마법','mage'],
 ['spellblade','마검사','마법','swordsman'],['duelist','결투가','공격','swordsman'],['bladedancer','검무사','공격','duelist'],
 ['scout','정찰병','공격',null],['pathfinder','길잡이','공격','scout'],['crossbowman','석궁병','공격','archer'],
 ['barriermage','결계술사','수호','mage'],['grandbarrier','대결계사','수호','barriermage'],['inquisitor','심문관','공격','priest'],
 ['grandinquisitor','대심문관','공격','inquisitor'],['phalanx','중장보병','수호','spearman'],['fortressknight','요새기사','수호','knight'],
 ['guardcaptain','근위대장','수호','warrior'],['sapper','공병','공격',null],['siegeengineer','공성기술자','공격','sapper'],['siegearcher','공성궁수','공격','crossbowman']
].map(([id,name,role,parent])=>({id,name,role,parent}));
export const job = id => JOBS.find(j=>j.id===id) || JOBS[0];
export const REGIONS = [
 {name:'잊혀진 숲',subtitle:'왕국의 경계 너머, 첫 번째 발걸음',bg:'forest',monster:'goblins',enemy:'숲 고블린',weak:'화염',color:'#8ba679'},
 {name:'침묵의 폐허',subtitle:'오래된 왕국의 흔적을 따라서',bg:'ruins',monster:'undead',enemy:'망각의 파수꾼',weak:'신성',color:'#b9a584'},
 {name:'잿빛 광산',subtitle:'어둠 속에서 빛나는 가능성',bg:'mine',monster:'orcs',enemy:'광산의 오크',weak:'번개',color:'#c99764'},
 {name:'얼어붙은 성역',subtitle:'눈보라 너머 잠든 진실',bg:'ice',monster:'elementals',enemy:'서리 정령',weak:'화염',color:'#9fcbcf'},
 {name:'붉은 용의 산맥',subtitle:'타오르는 하늘 아래',bg:'volcano',monster:'dragons',enemy:'잿불 비룡',weak:'냉기',color:'#d58e70'},
 {name:'세계의 균열',subtitle:'돌아갈 곳을 잊지 않도록',bg:'rift',monster:'demons',enemy:'균열의 악마',weak:'신성',color:'#b29fda'}
];
export const RECRUITS = [
 {name:'세라',age:26,job:'acolyte',variant:3,potential:'S',desc:'잊힌 신전의 치유사. 상처 너머의 가능성을 보았다.',cost:520},
 {name:'레온',age:32,job:'spearman',variant:0,potential:'A',desc:'전장에서 버려진 창병. 여전히 누군가를 지키고 싶어 한다.',cost:380},
 {name:'이브',age:28,job:'thief',variant:3,potential:'SS',desc:'침묵 속에 숨겨진 재능. 감정안만이 알아본 원석.',cost:850},
 {name:'아렌',age:30,job:'warrior',variant:1,potential:'A',desc:'몰락한 용병단의 생존자. 새로운 길을 찾는다.',cost:450},
 {name:'아리아',age:28,job:'mage',variant:3,potential:'S',desc:'포도주빛 망토의 마법사. 호쾌한 한 방을 즐기는 인간 여성.',cost:720},
 {name:'리엔',age:29,job:'swordsman',variant:3,potential:'A',desc:'자두빛 원정복을 입은 엘프 검사. 침묵 속에서 약속을 지킨다.',cost:480},
 {name:'미라',age:27,job:'thief',variant:3,potential:'S',desc:'밤바다 배색의 후드를 쓴 다크엘프 정찰자. 조용하고 신중하다.',cost:680},
 {name:'도윤',age:33,job:'archer',variant:0,potential:'A',desc:'황토빛 여행복의 인간 궁수. 낯선 길에서도 낙천적이다.',cost:430},
 {name:'라비',age:26,job:'acolyte',variant:4,potential:'S',desc:'긴 귀를 가진 토끼 수인 치유사. 동료를 보살피는 데 능하다.',cost:640},
 {name:'네리',age:25,job:'thief',variant:4,potential:'S',desc:'고양이 귀와 꼬리를 가진 수인 도적. 눈치가 빠르고 장난스럽다.',cost:690}
];
export const CHAPTERS = [
 {title:'막차가 향한 곳',stage:1,text:'스물아홉 살, 야근을 마치고 탄 버스. 졸음 사이로 창밖이 하얗게 물들었다. 눈을 떴을 때 발밑에는 거대한 마법진이 있었다. 왕은 우리를 마왕을 쓰러뜨릴 용사라 불렀다. 다른 이들의 손에는 기적이 깃들었다. 내 손에는 멈춰 버린 손목시계만 남았다.'},
 {title:'약속의 이면',stage:1,text:'“귀환의 방법을 찾아주겠네.” 국왕의 약속을 믿었다. 그러나 그날 밤, 병사들이 나를 성벽 밖에 버렸다. 특별한 힘이 없는 이방인에게 왕국은 자비를 낭비하지 않았다. 돌아가야 한다. 내 삶은 이곳에서 끝나지 않는다.'},
 {title:'보이지 않는 가치',stage:1,text:'시계를 판 돈은 금화 800닢. 그것이 내 전 재산이었다. 변방의 노예시장, 죽어가던 엘리나의 눈에서 이상한 빛을 보았다. “잠재력 S.” 머릿속에 떠오른 글자. 이것이 나의 힘이었다. 나는 그녀의 계약을 사들여 치료했다. 아직 누구도 믿을 수 없었다. 강제 계약만이 유일한 안전장치라고 생각했다.'},
 {title:'서툰 동행',stage:6,text:'엘리나는 처음으로 내 이름을 불렀다. 계약이 시켜서가 아니었다. 숲에서 만난 루네와 카일도 우리의 불 옆에 앉았다. 묶어 두는 것으로는 진짜 동료가 될 수 없다는 것을, 나는 아주 천천히 배우고 있었다.'},
 {title:'끊어진 사슬',stage:12,text:'폐허의 기록은 계약을 해제할 방법을 알려주었다. 돌아가는 길보다 먼저 선택해야 할 것이 있었다. “이제 떠나도 괜찮아.” 손목의 문양이 사라진 뒤에도 그녀는 곁에 남았다. 오늘부터 우리는 서로의 의지로 함께 걷는다.'},
 {title:'왕국이 감춘 것',stage:25,text:'소환은 구원이 아니었다. 왕국은 이방인들의 잠재력을 연료로 세계의 문을 붙잡고 있었다. 감정안은 사람뿐 아니라 마법과 물건의 본질도 읽기 시작했다. 우리는 진실을 찾기 위해 북쪽으로 향했다.'},
 {title:'돌아갈 곳',stage:50,text:'균열 저편에서 익숙한 버스 정류장이 보였다. 그러나 내 옆에는 더 이상 명령을 기다리는 이들이 없었다. 함께 미래를 고르는 사람들이 있었다. 귀환은 끝이 아니었다. 어떤 세계를 선택하든 우리의 모험은 계속된다.'}
];
