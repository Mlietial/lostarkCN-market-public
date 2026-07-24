const base = "../assets/star-vein/";
const STAR_VEIN_DRAFT_KEY="starVeinLotteryEditableDraftV1";
const STAR_VEIN_TEXT_SELECTORS=[".hero h1",".hero .lead",".rules .section-title h2",".shop .section-title h2",".price-note"];
const cachedStarVeinDraft=(()=>{try{return JSON.parse(localStorage.getItem(STAR_VEIN_DRAFT_KEY)||"null");}catch{return null;}})();
let restoredStarVeinDraft=null;
const starStoneValuation = window.LOSTARK_STAR_STONE_VALUES;
const starStoneValues = starStoneValuation.values;
const qualities = [["大红",1,.01,400],["金色",2,.04,160],["蓝色",3,.15,60],["绿色",4,.35,20],["白色",5,.45,6]];
const roomRates = [[.01,.04,.15,.35,.45],[.03,.08,.20,.35,.34],[.06,.13,.26,.30,.25],[.10,.18,.30,.27,.15],[.16,.24,.30,.20,.10]];
const taxRates=[0,.10,.20,.35,.50];
const ENGRAVING_CHOICE_NAME="遗物战斗刻印书自选箱子";
const ENGRAVING_RANDOM_NAME="遗物战斗刻印书随机箱子";
const itemValues={
  "命运破坏石结晶":{value:1377,stack:100,unit:"gold"},"命运破坏石":{value:256,stack:100,unit:"gold"},
  "命运守护石结晶":{value:27,stack:100,unit:"gold"},"命运守护石":{value:5,stack:100,unit:"gold"},
  "高级阿比多斯融合材料":{value:122,stack:1,unit:"gold"},"阿比多斯融合材料":{value:90,stack:1,unit:"gold"},
  "伟大的命运突破石":{value:34,stack:1,unit:"gold"},"命运突破石":{value:8,stack:1,unit:"gold"},
  "命运碎片袋子（中）":{value:123,stack:1,unit:"gold"},"冰川之息":{value:140,stack:1,unit:"gold"},"熔岩之息":{value:215,stack:1,unit:"gold"},
  "加工星石属性刷新券":{value:300,stack:1,unit:"blue"},"星石加工初始化券":{value:1600,stack:1,unit:"blue"},
  "英雄星石自选箱子":{value:1250,stack:1,unit:"starcoin"},"英雄星石箱子":{value:starStoneValues.heroStarBox.starcoin,merchantGold:starStoneValues.heroStarBox.merchantGold,stack:1,unit:"starcoin"},"稀有~英雄星石箱子":{value:7000,stack:1,unit:"gold"},"固定型英雄星石自选箱子":{value:2550,stack:1,unit:"starcoin"},
  "传说残酷炼狱钥匙兑换券":{value:940,stack:1,unit:"starcoin"},"英雄残酷炼狱钥匙兑换券":{value:560,stack:1,unit:"starcoin"},"英雄炼狱钥匙兑换券":{value:370,stack:1,unit:"starcoin"},
  "遗物战斗刻印书自选箱子":{value:0,stack:1,unit:"gold",auto:true},
  "遗物战斗刻印书随机箱子":{value:0,stack:1,unit:"gold",auto:true}
};
const choiceGroups={
  "4阶破坏石自选袋子Ⅱ":{selected:0,options:[{name:"命运破坏石结晶",label:"命运破坏石结晶（绑定）",qty:50},{name:"命运破坏石",label:"命运破坏石（绑定）",qty:250}]},
  "4阶守护石自选袋子Ⅱ":{selected:0,options:[{name:"命运守护石结晶",label:"命运守护石结晶（绑定）",qty:50},{name:"命运守护石",label:"命运守护石（绑定）",qty:250}]},
  "4阶融合材料自选箱子Ⅱ":{selected:0,options:[{name:"高级阿比多斯融合材料",label:"高级阿比多斯融合材料（绑定）",qty:5},{name:"阿比多斯融合材料",label:"阿比多斯融合材料（绑定）",qty:7}]},
  "4阶突破石自选箱子Ⅱ":{selected:0,options:[{name:"伟大的命运突破石",label:"伟大的命运突破石（绑定）",qty:5},{name:"命运突破石",label:"命运突破石（绑定）",qty:25}]}
};
const fixedBoxes={"4阶碎片自选箱子":{name:"命运碎片袋子（中）",qty:1},"冰川之息箱子":{name:"冰川之息",qty:5},"熔岩之息箱子":{name:"熔岩之息",qty:5}};
const itemIcons={"命运破坏石结晶":"新红石头.png","命运破坏石":"命运破坏石.jpg","命运守护石结晶":"新守护石.png","命运守护石":"命运守护石.jpg","高级阿比多斯融合材料":"新的融合材料.png","阿比多斯融合材料":"阿比多斯融合材料.jpg","伟大的命运突破石":"新突破石.png","命运突破石":"命运突破石.jpg"};
const itemCovers={"固定型英雄星石自选箱子":"固定型英雄星石自选箱子×1-封面.jpg","英雄残酷炼狱钥匙兑换券":"英雄残酷炼狱钥匙兑换券(第4赛季)×1-封面.jpg","英雄炼狱钥匙兑换券":"英雄炼狱钥匙兑换券(第4赛季)×1-封面.jpg","英雄星石箱子":"英雄星石箱子×1-封面.jpg","英雄星石自选箱子":"英雄星石自选箱子×1-封面.jpg","传说残酷炼狱钥匙兑换券":"传说残酷炼狱钥匙兑换券(第4赛季)×1-封面.jpg","遗物战斗刻印书自选箱子":"遗物战斗刻印书自选箱子×1-封面.jpg","遗物战斗刻印书随机箱子":"遗物战斗刻印书随机箱子×1-封面.jpg"};
const detailIcons={"命运碎片袋子（中）":"命运碎片袋子（中）.jpg","冰川之息":"冰川之息.jpg","熔岩之息":"熔岩之息.jpg","加工星石属性刷新券":"加工星石属性刷新券.jpg","星石加工初始化券":"星石加工初始化券.jpg","稀有~英雄星石箱子":"稀有~英雄星石箱子.jpg"};
const BLUE_SOURCES={normal:{label:"普通",blue:1,royal:1},weekly:{label:"周优惠",blue:30000,royal:28000},monthly:{label:"月优惠",blue:60000,royal:52000}};
const savedGiftSettings=(()=>{try{return JSON.parse(localStorage.getItem("giftPackSettings")||"{}");}catch{return {};}})();
const blueSettings={royalPerRmb:Number(savedGiftSettings.royalPerRmb)||100,source:"monthly",customRate:Number(savedGiftSettings.customBlueRateText)||0,exchangePrice:Number(savedGiftSettings.blueExchangePricePerThousand)||0};
let heroStarBoxValueMode=starStoneValuation.getMode();
const packs=[
 {name:"3周年顶级豪华礼包",limit:1,cost:18000,cover:"3周年顶级豪华礼包-封面.jpg",detail:"3周年顶级豪华礼包-内容物.jpg",items:[["4阶破坏石自选袋子Ⅱ",888],["4阶守护石自选袋子Ⅱ",8888],["4阶融合材料自选箱子Ⅱ",888],["熔岩之息箱子",88],["冰川之息箱子",88],["传说残酷炼狱钥匙兑换券",1],["固定型英雄星石自选箱子",6],["英雄星石自选箱子",6],["加工星石属性刷新券",30],["星石加工初始化券",10]]},
 {name:"3周年豪华礼包",limit:3,cost:4700,cover:"3周年豪华礼包-封面.jpg",detail:"3周年豪华礼包-内容物.jpg",items:[["4阶破坏石自选袋子Ⅱ",333],["4阶守护石自选袋子Ⅱ",3333],["4阶融合材料自选箱子Ⅱ",333],["熔岩之息箱子",33],["冰川之息箱子",33],["英雄残酷炼狱钥匙兑换券",1],["英雄星石自选箱子",3],["加工星石属性刷新券",3],["星石加工初始化券",3]]},
 {name:"4阶破坏石自选袋子Ⅱ ×20",limit:2800,cost:80,cover:"4阶破坏石自选袋子Ⅱ×20-封面.jpg",items:[["4阶破坏石自选袋子Ⅱ",20]]},
 {name:"4阶守护石自选袋子Ⅱ ×140",limit:1200,cost:14,cover:"4阶守护石自选袋子Ⅱ×140-封面.jpg",items:[["4阶守护石自选袋子Ⅱ",140]]},
 {name:"4阶融合材料自选箱子Ⅱ ×15",limit:1500,cost:45,cover:"4阶融合材料自选箱子II×15-封面.jpg",items:[["4阶融合材料自选箱子Ⅱ",15]]},
 {name:"4阶碎片自选箱子 ×20",limit:1500,cost:13,cover:"4阶碎片自选箱子×20-封面.jpg",items:[["4阶碎片自选箱子",20]]},
 {name:"4阶突破石自选箱子Ⅱ ×20",limit:1300,cost:18,cover:"4阶突破石自选箱子II×20-封面.jpg",items:[["4阶突破石自选箱子Ⅱ",20]]},
 {name:"冰川之息箱子 ×20",limit:1400,cost:75,cover:"冰川之息箱子×20-封面.jpg",items:[["冰川之息箱子",20]]},
 {name:"熔岩之息箱子 ×10",limit:400,cost:70,cover:"熔岩之息箱子×10-封面.jpg",items:[["熔岩之息箱子",10]]},
 {name:"精炼支援综合材料包",limit:3,cost:750,cover:"精炼支援综合材料包×1-封面.jpg",detail:"精炼支援综合材料包×1-内容物.jpg",items:[["4阶破坏石自选袋子Ⅱ",140],["4阶守护石自选袋子Ⅱ",280],["4阶碎片自选箱子",200],["4阶融合材料自选箱子Ⅱ",60],["熔岩之息箱子",40],["冰川之息箱子",40]]},
 {name:"精炼支援综合材料包2",limit:3,cost:2700,cover:"精炼支援综合材料包2×1-封面.jpg",detail:"精炼支援综合材料包2×1-内容物.jpg",items:[["4阶破坏石自选袋子Ⅱ",550],["4阶守护石自选袋子Ⅱ",500],["4阶融合材料自选箱子Ⅱ",400],["4阶突破石自选箱子Ⅱ",500],["熔岩之息箱子",90],["冰川之息箱子",90]]},
 {name:"加工星石属性刷新券 ×1",limit:100,cost:65,cover:"加工星石属性刷新券×1-封面.jpg",items:[["加工星石属性刷新券",1]]},
 {name:"星石补给礼包",limit:5,cost:1000,cover:"星石补给礼包×1-封面.jpg",detail:"星石补给礼包×1-内容物.jpg",items:[["稀有~英雄星石箱子",1],["英雄星石箱子",1],["加工星石属性刷新券",3],["星石加工初始化券",3]]},
 {name:"星石补给礼包2",limit:5,cost:8100,cover:"星石补给礼包2 ×1-封面.jpg",detail:"星石补给礼包2×1-内容物.jpg",items:[["英雄星石箱子",5],["英雄星石自选箱子",5],["加工星石属性刷新券",10],["固定型英雄星石自选箱子",1]]},
 {name:"星石加工初始化券 ×1",limit:100,cost:330,cover:"星石加工初始化券x1-封面.jpg",items:[["星石加工初始化券",1]]},
 {name:"遗物战斗刻印书随机箱子 ×1",limit:15,cost:45,cover:"遗物战斗刻印书随机箱子×1-封面.jpg",items:[[ENGRAVING_RANDOM_NAME,1]]},
 {name:"遗物战斗刻印书自选箱子 ×1",limit:5,cost:460,cover:"遗物战斗刻印书自选箱子×1-封面.jpg",items:[[ENGRAVING_CHOICE_NAME,1]]}
];
let selectedMultiplier=1;
let selectedRooms=5;
let expectedCoinsPerRmb=0;
let engravingChoice={date:"",name:"",value:0,count:0};
let simulationState={runs:0,totalCoins:0,totalRmb:0,totalCrystal:0,bigReds:0,taxHits:0,lastResult:null};
let simulationMode="quick";
let animatedSimulationState=null;
let animatedInfoOpen=true;
let animatedTween=null;
let starVeinTextEditing=false;
let starVeinDraftTimer=null;
const money=n=>new Intl.NumberFormat("zh-CN",{maximumFractionDigits:0}).format(Math.round(n));
const simulationQualityClasses=["quality-red","quality-gold","quality-blue","quality-green","quality-white"];
const prefersReducedMotion=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function applyStarVeinDraft(draft){
  if(!draft||typeof draft!=="object")return;
  if([1,10,50].includes(Number(draft.selectedMultiplier)))selectedMultiplier=Number(draft.selectedMultiplier);
  if(Number(draft.selectedRooms)>=1&&Number(draft.selectedRooms)<=5)selectedRooms=Number(draft.selectedRooms);
  if(["quick","animated"].includes(draft.simulationMode))simulationMode=draft.simulationMode;
  if(draft.simulationState&&typeof draft.simulationState==="object"){
    simulationState={...simulationState,...draft.simulationState};
  }
  Object.entries(draft.itemValues||{}).forEach(([name,saved])=>{
    const row=itemValues[name];
    if(!row||!saved)return;
    if(Number.isFinite(Number(saved.value)))row.value=Number(saved.value);
    if(Number.isFinite(Number(saved.merchantGold)))row.merchantGold=Number(saved.merchantGold);
  });
  Object.entries(draft.choiceSelections||{}).forEach(([name,index])=>{
    const group=choiceGroups[name];
    if(group&&group.options[Number(index)])group.selected=Number(index);
  });
  if(draft.blueSettings&&typeof draft.blueSettings==="object"){
    const source=draft.blueSettings.source;
    blueSettings.royalPerRmb=Number(draft.blueSettings.royalPerRmb)||blueSettings.royalPerRmb;
    blueSettings.source=BLUE_SOURCES[source]?source:blueSettings.source;
    blueSettings.customRate=Number(draft.blueSettings.customRate)||0;
    blueSettings.exchangePrice=Number(draft.blueSettings.exchangePrice)||0;
  }
  if(["starcoin","merchant"].includes(draft.heroStarBoxValueMode)){
    heroStarBoxValueMode=starStoneValuation.setMode(draft.heroStarBoxValueMode);
  }
}
function starVeinPageText(){
  return Object.fromEntries(STAR_VEIN_TEXT_SELECTORS.map(selector=>[selector,document.querySelector(selector)?.textContent?.trim()||""]));
}
function applyStarVeinPageText(){
  const pageText=restoredStarVeinDraft?.pageText||{};
  STAR_VEIN_TEXT_SELECTORS.forEach(selector=>{
    const element=document.querySelector(selector);
    if(!element)return;
    element.dataset.pageEditable="";
    if(pageText[selector])element.textContent=pageText[selector];
  });
}
function saveStarVeinDraft(){
  const savedItemValues=Object.fromEntries(Object.entries(itemValues).map(([name,row])=>[name,{value:row.value,merchantGold:row.merchantGold}]));
  const choiceSelections=Object.fromEntries(Object.entries(choiceGroups).map(([name,group])=>[name,group.selected]));
  localStorage.setItem(STAR_VEIN_DRAFT_KEY,JSON.stringify({
    version:1,
    savedAt:new Date().toISOString(),
    selectedMultiplier,
    selectedRooms,
    simulationMode,
    simulationState,
    itemValues:savedItemValues,
    choiceSelections,
    blueSettings:{...blueSettings},
    heroStarBoxValueMode,
    pageText:starVeinPageText()
  }));
}
function scheduleStarVeinDraftSave(){
  window.clearTimeout(starVeinDraftTimer);
  starVeinDraftTimer=window.setTimeout(saveStarVeinDraft,120);
}
function setStarVeinTextEditing(editing,announce=true){
  starVeinTextEditing=!!editing;
  STAR_VEIN_TEXT_SELECTORS.forEach(selector=>{
    const element=document.querySelector(selector);
    if(element)element.setAttribute("contenteditable",String(starVeinTextEditing));
  });
  const button=document.querySelector("#editStarVeinPageBtn");
  if(button)button.textContent=starVeinTextEditing?"完成编辑":"编辑文案";
  if(!starVeinTextEditing)saveStarVeinDraft();
  if(announce)window.LOSTARK_SHARE_EXPORT?.showToast(starVeinTextEditing?"蓝色虚线区域可直接修改文字":"页面文案已保存到浏览器缓存");
}
function escapeShareText(value){
  return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
function buildStarVeinPackCollage(){
  const collage=document.createElement("section");
  collage.className="share-collage";
  const cards=packs.map(pack=>{
    const calc=packMetrics(pack);
    const display=packDisplay(pack,calc);
    const images=[pack.cover,pack.detail].filter(Boolean).map((path,index)=>`<img src="${base}${escapeShareText(path)}" alt="${escapeShareText(pack.name)}${index?"详情":"封面"}" loading="eager" decoding="sync">`).join("");
    const roiClass=calc.roi>=100?"is-good":"is-bad";
    return `<article class="share-collage-card"><header class="share-collage-card-head"><h2>${escapeShareText(pack.name)}</h2><strong>${pack.cost.toLocaleString()} 星脉币</strong></header><div class="share-collage-media">${images||'<div class="share-collage-placeholder">暂无礼包图片</div>'}</div><div class="share-collage-metrics"><div><span>单份内容估值</span><strong>${display.singleGold}</strong></div><div><span>折合人民币</span><strong>${display.singleRmb}</strong></div><div><span>性价比</span><strong class="${roiClass}">${display.roi}</strong></div></div></article>`;
  }).join("");
  collage.innerHTML=`<header class="share-collage-head"><h1>${escapeShareText(document.querySelector(".shop .section-title h2")?.textContent||"礼包详情拼图")}</h1><p>${selectedMultiplier} 倍 · 推进 ${selectedRooms} 房 · 共 ${packs.length} 个兑换礼包</p></header><div class="share-collage-grid">${cards}</div>`;
  document.body.appendChild(collage);
  return collage;
}
function exportStarVeinImage(){
  setStarVeinTextEditing(false,false);
  setValueDrawer(false);
  closePackModal();
  saveStarVeinDraft();
  const collage=buildStarVeinPackCollage();
  if(!window.LOSTARK_SHARE_EXPORT){
    collage.remove();
    return;
  }
  window.LOSTARK_SHARE_EXPORT.exportPng({
    button:document.querySelector("#exportStarVeinImageBtn"),
    target:collage,
    title:"星脉兑换礼包详情拼图",
    filename:"星脉兑换礼包详情拼图",
    backgroundColor:"#eef5fb",
    scale:1.5,
    afterExport:()=>collage.remove()
  });
}
function drawSimulationQuality(roomIndex){const roll=Math.random();let cumulative=0;for(let index=0;index<roomRates[roomIndex].length;index++){cumulative+=roomRates[roomIndex][index];if(roll<cumulative)return index;}return roomRates[roomIndex].length-1;}
function createSimulationRoom(roomIndex,beforeTax){const taxed=Math.random()<taxRates[roomIndex];const afterTax=taxed?Math.floor(beforeTax*.5):beforeTax;const qualityIndex=drawSimulationQuality(roomIndex);const reward=qualities[qualityIndex][3]*selectedMultiplier;return {room:roomIndex+1,quality:qualities[qualityIndex][0],qualityIndex,reward,taxed,beforeTax,afterTax,taxLoss:beforeTax-afterTax,cumulative:afterTax+reward};}
function simulateExplorationOnce(){let coins=0;let bigReds=0;let taxHits=0;const rooms=[];for(let roomIndex=0;roomIndex<selectedRooms;roomIndex++){const room=createSimulationRoom(roomIndex,coins);coins=room.cumulative;if(room.qualityIndex===0)bigReds++;if(room.taxed)taxHits++;rooms.push(room);}return {coins,bigReds,taxHits,rooms,multiplier:selectedMultiplier,roomCount:selectedRooms,costRmb:10*selectedMultiplier,costCrystal:100*selectedMultiplier};}
function commitSimulationResult(result){const costRmb=result.costRmb??10*selectedMultiplier;const costCrystal=result.costCrystal??100*selectedMultiplier;simulationState.runs++;simulationState.totalCoins+=result.coins;simulationState.totalRmb+=costRmb;simulationState.totalCrystal+=costCrystal;simulationState.bigReds+=result.bigReds;simulationState.taxHits+=result.taxHits;simulationState.lastResult={...result,costRmb,costCrystal,roomCount:result.roomCount??result.rooms.length,multiplier:result.multiplier??selectedMultiplier};scheduleStarVeinDraftSave();}
function setSimulationMode(mode){
  simulationMode=mode==="animated"?"animated":"quick";
  const quickMode=simulationMode==="quick";
  const quickView=document.querySelector("#quickSimulationView");
  const animatedView=document.querySelector("#animatedSimulation");
  const quickActions=document.querySelector("#quickSimulationActions");
  if(quickView)quickView.hidden=!quickMode;
  if(animatedView)animatedView.hidden=quickMode;
  if(quickActions)quickActions.hidden=!quickMode;
  document.querySelectorAll("[data-simulation-mode]").forEach(button=>{
    const active=button.dataset.simulationMode===simulationMode;
    button.classList.toggle("active",active);
    button.setAttribute("aria-selected",String(active));
  });
  if(!quickMode)renderAnimatedSimulation();
}
function updateAnimatedActionState(){const active=!!animatedSimulationState?.active;["#simulateOnce","#simulateTen","#simulateHundred"].forEach(selector=>{const button=document.querySelector(selector);if(button)button.disabled=active;});}
function simulationStatsMarkup(){const average=simulationState.runs?simulationState.totalCoins/simulationState.runs:0;return `<div class="simulation-stat"><span>模拟次数</span><strong>${money(simulationState.runs)}</strong></div><div class="simulation-stat"><span>累计获得</span><strong>${money(simulationState.totalCoins)} 星脉币</strong></div><div class="simulation-stat"><span>平均获得</span><strong>${money(average)} 星脉币</strong></div><div class="simulation-stat"><span>累计花费</span><strong>${money(simulationState.totalRmb)} 元</strong><small>${money(simulationState.totalCrystal)} 彩钻</small></div><div class="simulation-stat"><span>大红次数</span><strong>${money(simulationState.bigReds)}</strong></div><div class="simulation-stat"><span>税收触发</span><strong>${money(simulationState.taxHits)}</strong></div>`;}
function simulationResultMarkup(result){return result?`<span>本次推进 ${result.roomCount??result.rooms.length} 房完成</span><strong>实际获得 ${money(result.coins)} 星脉币</strong><small>本次花费 ${money(result.costRmb??10*selectedMultiplier)} 元 / ${money(result.costCrystal??100*selectedMultiplier)} 彩钻，已计入全部奖励与税收</small>`:"";}
function animatedHistoryMarkup(){const result=simulationState.lastResult;if(!simulationState.runs||!result)return "";return `<section class="animated-history" aria-label="历史探索数据"><p class="animated-history-title">历史探索数据</p><div class="simulation-stats">${simulationStatsMarkup()}</div><div class="simulation-result">${simulationResultMarkup(result)}</div></section>`;}
function renderSimulation(){document.querySelector("#simulationTitle").textContent=`探索模拟 · ${selectedMultiplier}倍 / ${selectedRooms}房`;document.querySelector("#simulationStats").innerHTML=simulationStatsMarkup();const result=simulationState.lastResult;document.querySelector("#simulationRoomGrid").innerHTML=result?result.rooms.map(room=>`<article class="simulation-room"><h4>房间 ${room.room}</h4><span class="simulation-quality ${simulationQualityClasses[room.qualityIndex]}">${room.quality}</span><strong>+${money(room.reward)}</strong><small>${room.taxed?`进入时 ${money(room.beforeTax)} · <span class="tax-hit">税后 ${money(room.afterTax)}（-${money(room.taxLoss)}）</span>`:taxRates[room.room-1]>0?`进入时 ${money(room.beforeTax)} · 税收未触发`:`进入时 ${money(room.beforeTax)} · 无税收事件`}<br>本房奖励 +${money(room.reward)} · 实得 ${money(room.cumulative)}</small></article>`).join(""):`<div class="simulation-empty">等待首次模拟</div>`;const finalResult=document.querySelector("#simulationResult");finalResult.hidden=!result;finalResult.innerHTML=simulationResultMarkup(result);updateAnimatedActionState();}
function simulationProbabilitiesMarkup(includeTitle=true){const qualityNames=qualities.map(quality=>quality[0]);return `${includeTitle?"<strong>概率公示</strong>":""}<div class="simulation-probability-grid">${roomRates.map((rates,index)=>`<small>房间 ${index+1}：${rates.map((rate,qualityIndex)=>`${qualityNames[qualityIndex]} ${money(rate*100)}%`).join(" / ")} · 税收 ${money(taxRates[index]*100)}%</small>`).join("")}</div><p>基础奖励：大红 400、金色 160、蓝色 60、绿色 20、白色 6 星脉币；奖励按探索倍率放大。税收触发时先扣除当前累计星脉币的 50%（向下取整），再获得本房奖励。</p>`;}
function renderSimulationProbabilities(){document.querySelector("#simulationProbabilities").innerHTML=simulationProbabilitiesMarkup();}
function animatedBags(room,state){
  return Array.from({length:3},(_,index)=>{
    const selected=!!room&&state?.selectedBag===index;
    const locked=!room||state?.locked||state?.selectedBag!=null;
    const className=["dz-item",!room?"is-placeholder":"",selected?"revealed":"",selected?simulationQualityClasses[room.qualityIndex]:"",state?.selectedBag!=null&&!selected?"faded":""].filter(Boolean).join(" ");
    const sparks=Array.from({length:4},()=>`<i class="bag-spark"></i>`).join("");
    return `<button type="button" class="${className}" data-animated-bag="${index}" ${locked?"disabled":""} aria-label="翻开袋子 ${index+1}"><div class="icon-dz" data-quality="${selected?room.quality:""}">${sparks}</div><p>袋子${index+1}</p><div class="wh-text"><span>${selected?`+${money(room.reward)}`:"???"}</span></div></button>`;
  }).join("");
}
function animatedPopup(state,room){
  if(state?.showTaxNotice&&room?.taxed){
    return `<div class="animated-pop-backdrop"><section class="animated-pop tax-pop" role="dialog" aria-modal="true" aria-labelledby="animatedPopTitle"><p class="pop-kicker">进入第 ${room.room} 房</p><h5 id="animatedPopTitle">遭遇圣光税收队</h5><strong class="pop-tax-loss">-${money(room.taxLoss)} 星脉币</strong><p>进入时 ${money(room.beforeTax)} 星脉币，税后剩余 ${money(room.afterTax)} 星脉币。</p><button type="button" id="animatedConfirmTax">确认并继续</button></section></div>`;
  }
  if(state?.awaitingNext&&room){
    return `<div class="animated-pop-backdrop"><section class="animated-pop pop8 ${simulationQualityClasses[room.qualityIndex]}" role="dialog" aria-modal="true" aria-labelledby="animatedPopTitle"><p class="pop-kicker">第 ${room.room} 房奖励</p><h5 id="animatedPopTitle">翻牌成功</h5><span class="pop-quality">${room.quality}</span><strong class="pop-reward">+${money(room.reward)} 星脉币</strong><p>本房奖励已计入，当前累计 ${money(room.cumulative)} 星脉币。</p><button type="button" id="animatedNextRoom">${state.roomIndex>=selectedRooms?"完成本轮结算":"继续前进"}</button></section></div>`;
  }
  if(state?.finished){
    return `<div class="animated-pop-backdrop"><section class="animated-pop pop8" role="dialog" aria-modal="true" aria-labelledby="animatedPopTitle"><p class="pop-kicker">星脉迷宫结算</p><h5 id="animatedPopTitle">本轮探索完成</h5><strong class="pop-reward">${money(state.coins)} 星脉币</strong><p>${selectedRooms} 房全部结算 · 大红 ${money(state.bigReds)} 次 · 税收 ${money(state.taxHits)} 次</p><div class="animated-official-actions"><button type="button" id="animatedRestart">再来一局</button><button type="button" class="secondary" id="animatedCloseResult">关闭</button></div></section></div>`;
  }
  return "";
}
function toggleAnimatedInfo(){
  animatedInfoOpen=!animatedInfoOpen;
  const infoBox=document.querySelector("#animatedSimulation .gl-info-box");
  const toggle=document.querySelector("#animatedToggleInfo");
  if(!infoBox||!toggle)return;
  infoBox.classList.toggle("is-collapsed",!animatedInfoOpen);
  toggle.setAttribute("aria-expanded",String(animatedInfoOpen));
  toggle.querySelector(".pc-msg").textContent=animatedInfoOpen?"点击收起":"点击展开";
  toggle.querySelector(".h5-msg").textContent=animatedInfoOpen?"点击收起":"点击展开";
}
function renderAnimatedSimulation(){
  const container=document.querySelector("#animatedSimulation");
  if(!container)return;
  const state=animatedSimulationState;
  const room=state?.pending||state?.lastReveal||null;
  const currentRoom=room?.room||Math.min((state?.roomIndex||0)+1,selectedRooms);
  const stageTitle=state?.finished?"本轮探索已完成":state?.active?`当前房间 ${currentRoom} / ${selectedRooms}`:`${selectedMultiplier} 倍 · 推进 ${selectedRooms} 房`;
  const message=room?"点击袋子翻牌，选取后获得星脉币（按当前倍率结算）":"点击开始动画模拟，进入星脉迷宫选择袋子";
  const coins=state?.pending?state.pending.afterTax:state?.coins||0;
  const startAction=!state?`<div class="animated-start-prompt"><small>点击下方按钮，开始第 1 房动画翻牌</small><button type="button" id="animatedStart">开始探索</button></div>`:"";
  const exitAction=state?.active&&!state.awaitingNext?`<button type="button" class="secondary" id="animatedExit">结束本局</button>`:"";
  container.innerHTML=`<div class="p3-gl-box ${state?.active?"show-ani":""}">
    <div class="base-box"><div class="title p3-small-tit4"><span>星脉迷宫探险</span></div><p class="room-progress">${stageTitle}</p><p class="msg">${message}</p><div class="dz-box">${animatedBags(room,state)}</div><p class="carry-coins">随身星脉币：<strong>${money(coins)}</strong></p><div class="animated-official-actions">${startAction}${exitAction}</div></div>
    ${animatedHistoryMarkup()}
    <div class="gl-info-box ${animatedInfoOpen?"":"is-collapsed"}">
      <div class="top-box"><p>| 概率信息板</p><button type="button" class="btn-djsq" id="animatedToggleInfo" aria-expanded="${animatedInfoOpen}"><i class="p3-icon-jt"></i><span class="pc-msg">${animatedInfoOpen?"点击收起":"点击展开"}</span><span class="h5-msg">${animatedInfoOpen?"点击收起":"点击展开"}</span></button></div>
      <div class="center-box"><div class="center-inner"><div class="center-content"><div class="simulation-probabilities">${simulationProbabilitiesMarkup(false)}</div></div></div></div>
    </div>
    ${animatedPopup(state,room)}
  </div>`;
  container.querySelector("#animatedToggleInfo")?.addEventListener("click",toggleAnimatedInfo);
  container.querySelectorAll("[data-animated-bag]").forEach(button=>button.addEventListener("click",()=>chooseAnimatedBag(button)));
  container.querySelector("#animatedStart")?.addEventListener("click",startAnimatedSimulation);
  container.querySelector("#animatedConfirmTax")?.addEventListener("click",confirmAnimatedTax);
  container.querySelector("#animatedNextRoom")?.addEventListener("click",advanceAnimatedRoom);
  container.querySelector("#animatedExit")?.addEventListener("click",resetAnimatedSimulation);
  container.querySelector("#animatedRestart")?.addEventListener("click",startAnimatedSimulation);
  container.querySelector("#animatedCloseResult")?.addEventListener("click",resetAnimatedSimulation);
  updateAnimatedActionState();
}
function playAnimatedRoomEntrance(){
  if(prefersReducedMotion())return;
  const bags=document.querySelectorAll("#animatedSimulation [data-animated-bag]");
  if(!bags.length)return;
  if(window.gsap){
    window.gsap.killTweensOf(bags);
    animatedTween=window.gsap.timeline({defaults:{ease:"power3.out"}})
      .fromTo("#animatedSimulation .p3-small-tit4",{autoAlpha:0,y:-8},{autoAlpha:1,y:0,duration:.3})
      .fromTo(bags,{autoAlpha:0,y:26,scale:.9},{autoAlpha:1,y:0,scale:1,duration:.48,stagger:.11,overwrite:"auto"},"<.05");
    return;
  }
  bags.forEach((bag,index)=>bag.animate([{opacity:0,transform:"translateY(26px) scale(.9)"},{opacity:1,transform:"translateY(0) scale(1)"}],{duration:480,delay:index*110,easing:"cubic-bezier(.2,.8,.2,1)",fill:"both"}));
}
function playAnimatedBagReveal(button,room,onComplete){
  const shell=button.querySelector(".icon-dz");
  const reward=button.querySelector(".wh-text");
  const sparks=button.querySelectorAll(".bag-spark");
  const reveal=()=>{
    button.classList.add("revealed",simulationQualityClasses[room.qualityIndex]);
    shell.dataset.quality=room.quality;
    reward.querySelector("span").textContent=`+${money(room.reward)}`;
    button.setAttribute("aria-label",`袋子奖励：${room.quality}，${money(room.reward)} 星脉币`);
  };
  if(prefersReducedMotion()){
    reveal();
    onComplete();
    return;
  }
  if(window.gsap){
    const timeline=window.gsap.timeline({defaults:{ease:"power2.out"},onComplete});
    animatedTween=timeline
      .to(button,{y:-10,scale:1.035,duration:.2,overwrite:"auto"})
      .to(shell,{rotation:-6,duration:.075,repeat:5,yoyo:true,ease:"power1.inOut"})
      .to(shell,{rotation:0,rotationY:90,scale:.92,duration:.2,ease:"power2.in"})
      .call(reveal)
      .to(shell,{rotationY:0,scale:1,duration:.42,ease:"back.out(1.8)"})
      .fromTo(reward,{autoAlpha:0,y:14,scale:.65},{autoAlpha:1,y:0,scale:1,duration:.3,ease:"back.out(1.7)"},"<.08")
      .fromTo(sparks,{autoAlpha:0,scale:0},{autoAlpha:1,scale:1.7,duration:.24,stagger:{amount:.18,from:"random"}},"<")
      .to(sparks,{autoAlpha:0,scale:2.5,duration:.35,stagger:.04})
      .to(button,{y:0,scale:1,duration:.2},"<");
    return;
  }
  const first=shell.animate([{transform:"rotateY(0deg) scale(1)"},{transform:"rotateY(90deg) scale(.92)"}],{duration:250,easing:"ease-in",fill:"forwards"});
  first.onfinish=()=>{
    reveal();
    const second=shell.animate([{transform:"rotateY(90deg) scale(.92)"},{transform:"rotateY(0deg) scale(1)"}],{duration:420,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"});
    second.onfinish=onComplete;
  };
}
function playAnimatedResultEntrance(){
  if(prefersReducedMotion())return;
  const backdrop=document.querySelector("#animatedSimulation .animated-pop-backdrop");
  const popup=backdrop?.querySelector(".animated-pop");
  if(!backdrop||!popup)return;
  if(window.gsap){
    animatedTween=window.gsap.timeline({defaults:{ease:"power3.out"}})
      .fromTo(backdrop,{autoAlpha:0},{autoAlpha:1,duration:.2})
      .fromTo(popup,{autoAlpha:0,y:18,scale:.9},{autoAlpha:1,y:0,scale:1,duration:.38,ease:"back.out(1.5)"},"<.05");
    return;
  }
  backdrop.animate([{opacity:0},{opacity:1}],{duration:200,easing:"ease-out",fill:"both"});
  popup.animate([{opacity:0,transform:"translateY(18px) scale(.9)"},{opacity:1,transform:"translateY(0) scale(1)"}],{duration:380,easing:"cubic-bezier(.2,.8,.2,1)",fill:"both"});
}
function startAnimatedSimulation(){
  if(animatedSimulationState?.active)return;
  setSimulationMode("animated");
  animatedSimulationState={active:true,finished:false,roomIndex:0,coins:0,bigReds:0,taxHits:0,rooms:[],pending:null,lastReveal:null,selectedBag:null,awaitingNext:false,showTaxNotice:false,locked:false};
  openAnimatedRoom();
  document.querySelector("#animatedSimulation")?.scrollIntoView({behavior:prefersReducedMotion()?"auto":"smooth",block:"center"});
}
function openAnimatedRoom(){
  const state=animatedSimulationState;
  if(!state||!state.active||state.roomIndex>=selectedRooms)return;
  state.pending=createSimulationRoom(state.roomIndex,state.coins);
  state.lastReveal=null;
  state.selectedBag=null;
  state.awaitingNext=false;
  state.showTaxNotice=state.pending.taxed;
  state.locked=state.showTaxNotice;
  renderAnimatedSimulation();
  window.requestAnimationFrame(state.showTaxNotice?playAnimatedResultEntrance:playAnimatedRoomEntrance);
}
function confirmAnimatedTax(){
  const state=animatedSimulationState;
  if(!state?.active||!state.showTaxNotice)return;
  state.showTaxNotice=false;
  state.locked=false;
  renderAnimatedSimulation();
  window.requestAnimationFrame(playAnimatedRoomEntrance);
}
function chooseAnimatedBag(button){
  const state=animatedSimulationState;
  if(!state?.active||!state.pending||state.locked)return;
  state.locked=true;
  state.selectedBag=Number(button.dataset.animatedBag);
  document.querySelectorAll("#animatedSimulation [data-animated-bag]").forEach(bag=>{
    bag.disabled=true;
    if(bag!==button)bag.classList.add("faded");
  });
  const room=state.pending;
  playAnimatedBagReveal(button,room,()=>{
    state.coins=room.cumulative;
    state.bigReds+=room.qualityIndex===0?1:0;
    state.taxHits+=room.taxed?1:0;
    state.rooms.push(room);
    state.roomIndex++;
    state.pending=null;
    state.lastReveal=room;
    state.awaitingNext=true;
    state.locked=false;
    renderAnimatedSimulation();
    window.requestAnimationFrame(playAnimatedResultEntrance);
  });
}
function advanceAnimatedRoom(){
  const state=animatedSimulationState;
  if(!state?.active||!state.awaitingNext)return;
  if(state.roomIndex>=selectedRooms){
    finishAnimatedSimulation();
    return;
  }
  openAnimatedRoom();
}
function finishAnimatedSimulation(){
  const state=animatedSimulationState;
  if(!state?.active)return;
  const result={coins:state.coins,bigReds:state.bigReds,taxHits:state.taxHits,rooms:state.rooms,multiplier:selectedMultiplier,roomCount:selectedRooms,costRmb:10*selectedMultiplier,costCrystal:100*selectedMultiplier};
  state.active=false;
  state.finished=true;
  state.awaitingNext=false;
  commitSimulationResult(result);
  renderSimulation();
  renderAnimatedSimulation();
  window.requestAnimationFrame(playAnimatedResultEntrance);
}
function resetAnimatedSimulation(){
  if(animatedTween?.kill)animatedTween.kill();
  animatedTween=null;
  animatedSimulationState=null;
  renderAnimatedSimulation();
}
function runSimulation(count){if(animatedSimulationState?.active)return;for(let index=0;index<count;index++)commitSimulationResult(simulateExplorationOnce());renderSimulation();}
function resetSimulation(){simulationState={runs:0,totalCoins:0,totalRmb:0,totalCrystal:0,bigReds:0,taxHits:0,lastResult:null};resetAnimatedSimulation();renderSimulation();}
function setSimulationMultiplier(multiplier){selectedMultiplier=multiplier;document.querySelectorAll(".choice-btn").forEach(button=>button.classList.toggle("active",Number(button.dataset.multiplier)===multiplier));document.querySelectorAll(".simulation-multiplier").forEach(button=>button.classList.toggle("active",Number(button.dataset.simulationMultiplier)===multiplier));renderRooms();resetAnimatedSimulation();renderSimulation();}
function initSimulation(){renderSimulationProbabilities();renderAnimatedSimulation();renderSimulation();setSimulationMode(simulationMode);document.querySelectorAll("[data-simulation-mode]").forEach(button=>button.addEventListener("click",()=>setSimulationMode(button.dataset.simulationMode)));document.querySelector("#simulateOnce").addEventListener("click",()=>runSimulation(1));document.querySelector("#simulateTen").addEventListener("click",()=>runSimulation(10));document.querySelector("#simulateHundred").addEventListener("click",()=>runSimulation(100));document.querySelector("#resetSimulation").addEventListener("click",resetSimulation);document.querySelectorAll(".simulation-multiplier").forEach(button=>button.addEventListener("click",()=>setSimulationMultiplier(Number(button.dataset.simulationMultiplier))));}
function renderRooms(){let dist=new Map([[0,1]]);const stats=[];let html="";for(let r=0;r<5;r++){const next=new Map();for(const [coins,p0] of dist){const taxed=[[Math.floor(coins*.5),p0*taxRates[r]],[coins,p0*(1-taxRates[r])]];for(const [after,pTax] of taxed){if(!pTax)continue;roomRates[r].forEach((p,i)=>{const value=qualities[i][3]*selectedMultiplier;next.set(after+value,(next.get(after+value)||0)+pTax*p);});}}dist=next;const cumulative=[...dist].reduce((s,[v,p])=>s+v*p,0);stats.push(cumulative);const state=r+1===selectedRooms?" selected":r+1>selectedRooms?" beyond":"";html+=`<article class="room${state}"><h3>推进 ${r+1} 房</h3><div class="ev">${money(cumulative)} <small>星脉币</small></div><small>计入各房间奖励概率与税收事件后的累计获取均值</small></article>`;}document.querySelector("#roomGrid").innerHTML=html;const selected=stats[selectedRooms-1];const costRmb=10*selectedMultiplier;const costCrystal=100*selectedMultiplier;expectedCoinsPerRmb=selected/costRmb;localStorage.setItem("starVeinExpectedCoinsPerRmb",String(expectedCoinsPerRmb));document.querySelector("#exploreSummary").innerHTML=`<strong>${selectedMultiplier} 倍 · 推进 ${selectedRooms} 房</strong><span>累计获取均值 <b>${money(selected)} 星脉币</b></span><span>消耗 <b>${costRmb} 元 / ${costCrystal} 彩钻</b></span><span>约 <b>${expectedCoinsPerRmb.toFixed(2)} 星脉币 / 元</b></span>`;renderPacks();}
function blueExchangeServiceFee(totalBlue){return window.LOSTARK_BLUE_EXCHANGE_FEES.serviceFee(totalBlue);}
function blueExchangeLots(neededBlue){return window.LOSTARK_BLUE_EXCHANGE_FEES.purchaseForNet(neededBlue);}
function blueToGold(blue){if(blueSettings.exchangePrice>0)return blueExchangeLots(blue).grossBlue/1000*blueSettings.exchangePrice;const goldRate=Number(document.querySelector("#goldRate").value)||0;if(blueSettings.customRate>0)return blue/blueSettings.customRate*goldRate;const source=BLUE_SOURCES[blueSettings.source];const royal=blue*source.royal/source.blue;return royal/blueSettings.royalPerRmb*goldRate;}
function blueSourceText(){if(blueSettings.exchangePrice>0)return `交易所 ${money(blueSettings.exchangePrice)} 金/千蓝（含分档服务费）`;if(blueSettings.customRate>0)return `自定义 ${blueSettings.customRate} 蓝钻/元`;const source=BLUE_SOURCES[blueSettings.source];return `${source.label}：${source.blue} 蓝钻 = ${source.royal} 彩钻` ;}
function syncEngravingChoice(payload){const rows=(payload?.engravingBookPrices||[]).map(row=>({date:String(row.date||"").slice(0,10),name:String(row.name||"").trim(),value:Number(row.lowest)})).filter(row=>row.date&&row.name&&Number.isFinite(row.value)&&row.value>0);if(!rows.length)return;const latestDate=rows.reduce((latest,row)=>row.date>latest?row.date:latest,rows[0].date);const latestRows=rows.filter(row=>row.date===latestDate);const highest=latestRows.reduce((best,row)=>row.value>best.value?row:best,latestRows[0]);engravingChoice={date:latestDate,name:highest.name,value:highest.value,count:latestRows.length};itemValues[ENGRAVING_CHOICE_NAME].value=highest.value;itemValues[ENGRAVING_RANDOM_NAME].value=highest.value;}
function unitGold(name){const row=itemValues[name];if(!row)return 0;if(name==="英雄星石箱子"&&heroStarBoxValueMode==="merchant")return row.merchantGold;if(row.unit==="blue")return blueToGold(row.value);if(row.unit==="starcoin"){const goldRate=Number(document.querySelector("#goldRate").value)||0;return expectedCoinsPerRmb?row.value/expectedCoinsPerRmb*goldRate:0;}return row.value/row.stack;}
function resolveSource(name){if(name===ENGRAVING_RANDOM_NAME)return {name,label:"随机遗物战斗刻印书",qty:1,boxValue:unitGold(name),minBoxValue:1,maxBoxValue:unitGold(name)};if(name===ENGRAVING_CHOICE_NAME)return {name,label:engravingChoice.name?`${engravingChoice.name}遗物刻印书`:name,qty:1,boxValue:unitGold(name)};if(choiceGroups[name]){const opt=choiceGroups[name].options[choiceGroups[name].selected];return {...opt,boxValue:unitGold(opt.name)*opt.qty};}if(fixedBoxes[name]){const opt=fixedBoxes[name];return {...opt,boxValue:unitGold(opt.name)*opt.qty};}return {name,qty:1,boxValue:unitGold(name)};}
function renderChoices(){document.querySelector("#materialChoices").innerHTML=Object.entries(choiceGroups).map(([source,g])=>`<section class="choice-group"><h3>${source}</h3><p>当前计入：${g.options[g.selected].label} ×${g.options[g.selected].qty}</p><div>${g.options.map((o,i)=>`<button type="button" class="material-option${i===g.selected?" active":""}" data-source="${source}" data-index="${i}"><img src="../assets/${itemIcons[o.name]}" alt=""><span>${o.label} ×${o.qty}</span><strong>${money(unitGold(o.name)*o.qty)} 金 / 箱</strong></button>`).join("")}</div></section>`).join("");document.querySelectorAll(".material-option").forEach(btn=>btn.addEventListener("click",()=>{choiceGroups[btn.dataset.source].selected=Number(btn.dataset.index);renderChoices();renderPacks();}));}
function priceInputHtml(n,row){const merchant=n==="英雄星石箱子"&&heroStarBoxValueMode==="merchant";const unit=merchant?"商人金币 / 份":row.unit==="blue"?"蓝钻 / 份":row.unit==="starcoin"?"星脉币 / 份":row.stack>1?`金币 / ${row.stack} 个`:"金币 / 个";const value=merchant?row.merchantGold:row.value;return `<label>${n}<span>${unit}</span><input data-price="${n}" type="number" min="0" step="0.01" value="${value}"></label>`;}
function renderPrices(){const heroStarValueNames=["英雄星石自选箱子","英雄星石箱子"];const entries=Object.entries(itemValues);document.querySelector("#priceEditor").innerHTML=entries.filter(([name,row])=>!heroStarValueNames.includes(name)&&!row.auto).map(([name,row])=>priceInputHtml(name,row)).join("");document.querySelector("#heroStarValueEditor").innerHTML=heroStarValueNames.map(name=>priceInputHtml(name,itemValues[name])).join("");document.querySelectorAll("[data-price]").forEach(i=>i.addEventListener("input",()=>{const row=itemValues[i.dataset.price];if(i.dataset.price==="英雄星石箱子"&&heroStarBoxValueMode==="merchant")row.merchantGold=Number(i.value)||0;else row.value=Number(i.value)||0;renderPacks();}));}
function valueItem(source,boxQty){const resolved=resolveSource(source);const gold=boxQty*resolved.boxValue;return {source,boxQty,...resolved,totalQty:boxQty*resolved.qty,gold,minGold:boxQty*(resolved.minBoxValue??resolved.boxValue),maxGold:boxQty*(resolved.maxBoxValue??resolved.boxValue)};}
function packRows(pack){return (pack.items||[]).map(([name,qty])=>valueItem(name,qty));}
function packMetrics(pack){const goldRate=Number(document.querySelector("#goldRate").value)||0;const rows=packRows(pack);const minValueGold=rows.reduce((sum,row)=>sum+row.minGold,0);const maxValueGold=rows.reduce((sum,row)=>sum+row.maxGold,0);const valueGold=maxValueGold;const costRmb=expectedCoinsPerRmb?pack.cost/expectedCoinsPerRmb:0;const minValueRmb=goldRate?minValueGold/goldRate:0;const maxValueRmb=goldRate?maxValueGold/goldRate:0;const minRoi=costRmb?minValueRmb/costRmb*100:0;const maxRoi=costRmb?maxValueRmb/costRmb*100:0;return {rows,valueGold,minValueGold,maxValueGold,costRmb,valueRmb:maxValueRmb,minValueRmb,maxValueRmb,roi:maxRoi,minRoi,maxRoi,isRange:Math.abs(maxValueGold-minValueGold)>.001};}
function packDisplay(pack,calc){const range=(min,max,format)=>calc.isRange?`${format(min)} ~ ${format(max)}`:format(max);return {singleGold:range(calc.minValueGold,calc.maxValueGold,value=>`${money(value)} 金`),singleRmb:range(calc.minValueRmb,calc.maxValueRmb,value=>`¥${value.toFixed(2)}`),allGold:range(calc.minValueGold*pack.limit,calc.maxValueGold*pack.limit,value=>`${money(value)} 金`),allRmb:range(calc.minValueRmb*pack.limit,calc.maxValueRmb*pack.limit,value=>`¥${value.toFixed(2)}`),roi:range(calc.minRoi,calc.maxRoi,value=>`${value.toFixed(1)}%`),roiClass:calc.isRange?"roi-range":calc.roi>=100?"roi-good":"roi-bad"};}
function detailIconSrc(name){return itemCovers[name]?base+itemCovers[name]:detailIcons[name]?`../assets/${detailIcons[name]}`:"";}
function valueRowsHtml(rows){if(!rows.length)return "";return `<div class="value-table">${rows.map(row=>{const source=itemValues[row.name];const openName=row.label||row.name;const icon=detailIconSrc(row.name);const merchantHero=row.name==="英雄星石箱子"&&heroStarBoxValueMode==="merchant";const engraving=row.name===ENGRAVING_CHOICE_NAME;const randomEngraving=row.name===ENGRAVING_RANDOM_NAME;const total=randomEngraving?`${money(row.minGold)} ~ ${money(row.maxGold)} 金<small>${engravingChoice.date} 每日 ${engravingChoice.count} 本最高价为 ${money(engravingChoice.value)} 金</small>`:engraving?`${money(row.gold)} 金<small>${engravingChoice.date} 每日 ${engravingChoice.count} 本最高价</small>`:merchantHero?`${money(source.merchantGold*row.totalQty)} 金<small>按商人售价计入</small>`:source?.unit==="blue"?`${money(source.value*row.totalQty)} 蓝钻<small>${blueSourceText()} · 折 ${money(row.gold)} 金</small>`:source?.unit==="starcoin"?`${money(source.value*row.totalQty)} 星脉币<small>按当前探索期望折 ${money(row.gold)} 金</small>`:`${money(row.gold)} 金`;const unit=randomEngraving?`1 ~ ${money(engravingChoice.value)} 金/本`:engraving?`${money(engravingChoice.value)} 金/本（当前最低价）`:merchantHero?`${money(source.merchantGold)} 商人金币/个`:source?.unit==="blue"?`${source.value} 蓝钻/个`:source?.unit==="starcoin"?`${source.value} 星脉币/个`:`${money(unitGold(row.name))} 金/个`;return `<div class="detail-item-card"><img class="row-cover" src="${icon}" alt="${openName}图标"><span class="detail-item-copy"><b>${row.source}</b> ×${row.boxQty}<small>开出 ${openName} ×${row.totalQty}</small><small>${unit}</small></span><strong>${total}</strong></div>`;}).join("")}</div>`;}
function modalChoicesHtml(pack){const sources=[...new Set((pack.items||[]).map(item=>item[0]).filter(name=>choiceGroups[name]))];if(!sources.length)return "";return `<div class="modal-choice-list">${sources.map(source=>{const group=choiceGroups[source];const selected=group.options[group.selected];const boxQty=(pack.items||[]).find(item=>item[0]===source)?.[1]||0;return `<section class="modal-choice-group"><h3>${source} ×${money(boxQty)}</h3><p>当前计入：${selected.label} ×${money(selected.qty*boxQty)}</p><div class="modal-options">${group.options.map((option,index)=>{const perBoxValue=unitGold(option.name)*option.qty;return `<label class="modal-option"><input type="radio" name="modal-${source}" data-modal-source="${source}" data-modal-index="${index}" ${index===group.selected?"checked":""}><img src="../assets/${itemIcons[option.name]}" alt=""><span>${option.label} ×${money(option.qty*boxQty)}<small>每箱 ×${option.qty} · 共 ${money(boxQty)} 箱</small></span><strong>${money(perBoxValue*boxQty)} 金<small>${money(perBoxValue)} 金/箱</small></strong></label>`;}).join("")}</div></section>`;}).join("")}</div>`;}
function renderPackModal(index){const pack=packs[index];const calc=packMetrics(pack);const display=packDisplay(pack,calc);const detailRows=calc.rows.filter(row=>!choiceGroups[row.source]);const allCostRmb=calc.costRmb*pack.limit;const allCostCoins=pack.cost*pack.limit;const media=[`<img src="${base+pack.cover}" alt="${pack.name}封面">`,pack.detail?`<img src="${base+pack.detail}" alt="${pack.name}内容物">`:""].join("");document.querySelector("#packModalContent").innerHTML=`<div class="modal-grid"><div class="modal-media">${media}</div><div class="modal-body"><h2 id="packModalTitle">${pack.name}</h2><div class="modal-meta">限购 ${money(pack.limit)} · 单份 ${pack.cost.toLocaleString()} 星脉币 · 全部兑换 ${money(allCostCoins)} 星脉币 / ¥${allCostRmb.toFixed(2)}</div><div class="pack-stats"><div class="stat"><span>单份内容估值</span><strong>${display.singleGold}</strong><small>约 ${display.singleRmb}</small><small class="limit-total">限购全部：<b>${display.allGold} · ${display.allRmb}</b></small></div><div class="stat"><span>性价比</span><strong class="${display.roiClass}">${display.roi}</strong><small>限购数量不影响比例</small></div><div class="stat"><span>蓝钻口径</span><strong>${blueSourceText()}</strong><small>与礼包分析页一致</small></div></div>${modalChoicesHtml(pack)}${detailRows.length?`<div class="modal-value-table">${valueRowsHtml(detailRows)}</div>`:""}</div></div>`;document.querySelector("#packModalBackdrop").hidden=false;document.body.style.overflow="hidden";document.querySelectorAll("[data-modal-source]").forEach(input=>input.addEventListener("change",()=>{choiceGroups[input.dataset.modalSource].selected=Number(input.dataset.modalIndex);renderPacks();renderPackModal(index);}));}
function closePackModal(){document.querySelector("#packModalBackdrop").hidden=true;document.body.style.overflow="";}
function renderPacks(){document.querySelector("#packGrid").innerHTML=packs.map((pack,index)=>{const calc=packMetrics(pack);const display=packDisplay(pack,calc);const allCostRmb=calc.costRmb*pack.limit;const allCostCoins=pack.cost*pack.limit;return `<article class="pack-card" data-pack-index="${index}" role="button" tabindex="0"><div class="pack-top"><img class="pack-cover" src="${base+pack.cover}" alt="${pack.name}封面"><div class="pack-copy"><h3 class="pack-title">${pack.name}</h3><div class="meta">限购 ${money(pack.limit)} · 兑换价 ${pack.cost.toLocaleString()} 星脉币</div></div><div class="pack-cost"><div class="cost">${pack.cost.toLocaleString()} <small>星脉币</small></div></div></div><div class="pack-stats"><div class="stat"><span>单份内容估值</span><strong>${display.singleGold}</strong><small>约 ${display.singleRmb}</small><small class="limit-total">限购全换：<b>${display.allGold} · ${display.allRmb}</b></small></div><div class="stat"><span>单份兑换成本</span><strong>¥${calc.costRmb.toFixed(2)}</strong><small>按当前推进房间</small><small class="limit-total">全部消耗：<b>${money(allCostCoins)} 星脉币 · ¥${allCostRmb.toFixed(2)}</b></small></div><div class="stat"><span>性价比</span><strong class="${display.roiClass}">${display.roi}</strong><small>限购数量不影响比例</small><small class="limit-total">内容价值 / 兑换成本</small></div></div></article>`;}).join("");document.querySelectorAll("[data-pack-index]").forEach(card=>{const open=()=>renderPackModal(Number(card.dataset.packIndex));card.addEventListener("click",open);card.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open();}});});}
function updateBlueControlState(){document.querySelector("#blueSource").disabled=blueSettings.customRate>0||blueSettings.exchangePrice>0;document.querySelector("#customBlueRate").disabled=blueSettings.exchangePrice>0;document.querySelector("#blueExchangePrice").disabled=blueSettings.customRate>0;}
async function syncDailyGoldRate(){try{let payload;if(location.protocol==="file:"){payload=window.LOSTARK_PUBLIC_DASHBOARD_STATE;if(!payload)throw new Error("本地金价数据未加载");}else{const response=await fetch(`../data/dashboard-state.json?v=${Date.now()}`,{cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);payload=await response.json();}syncEngravingChoice(payload);const auctions=(payload.goldTxns||[]).map(txn=>({date:String(txn.date||""),rate:Number(txn.gold)/Number(txn.price),type:txn.type})).filter(txn=>txn.type==="拍卖交易"&&txn.date&&Number.isFinite(txn.rate)&&txn.rate>0);if(!auctions.length)throw new Error("没有拍卖交易");const latestDate=auctions.reduce((latest,txn)=>txn.date>latest?txn.date:latest,auctions[0].date);const rate=Math.max(...auctions.filter(txn=>txn.date===latestDate).map(txn=>txn.rate));document.querySelector("#goldRate").value=rate.toFixed(2);document.querySelector("#goldRateNote").textContent=`${latestDate} 当日拍卖交易最高值`;renderPacks();}catch(error){document.querySelector("#goldRateNote").textContent="读取失败，暂用页面默认值";}}
let valueDrawerCloseTimer=0;
function setValueDrawer(open){const drawer=document.querySelector("#valueDrawer");const backdrop=document.querySelector("#valueDrawerBackdrop");const toggle=document.querySelector("#valueDrawerToggle");window.clearTimeout(valueDrawerCloseTimer);toggle.setAttribute("aria-expanded",String(open));drawer.setAttribute("aria-hidden",String(!open));if(open){drawer.hidden=false;backdrop.hidden=false;window.requestAnimationFrame(()=>{drawer.classList.add("is-open");backdrop.classList.add("is-open");});return;}drawer.classList.remove("is-open");backdrop.classList.remove("is-open");const finish=()=>{if(toggle.getAttribute("aria-expanded")==="false"){drawer.hidden=true;backdrop.hidden=true;}};if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)finish();else valueDrawerCloseTimer=window.setTimeout(finish,250);}
function init(){
  applyStarVeinPageText();
  document.querySelector("#royalRate").value=blueSettings.royalPerRmb;
  document.querySelector("#blueSource").value=blueSettings.source;
  document.querySelector("#customBlueRate").value=blueSettings.customRate||"";
  document.querySelector("#blueExchangePrice").value=blueSettings.exchangePrice||"";
  document.querySelector("#heroStarBoxValueMode").value=heroStarBoxValueMode;
  document.querySelectorAll(".choice-btn").forEach(button=>button.classList.toggle("active",Number(button.dataset.multiplier)===selectedMultiplier));
  document.querySelectorAll(".simulation-multiplier").forEach(button=>button.classList.toggle("active",Number(button.dataset.simulationMultiplier)===selectedMultiplier));
  document.querySelectorAll(".room-btn").forEach(button=>button.classList.toggle("active",Number(button.dataset.rooms)===selectedRooms));
  syncEngravingChoice(window.LOSTARK_PUBLIC_DASHBOARD_STATE);
  updateBlueControlState();
  renderPrices();
  renderRooms();
  syncDailyGoldRate();
  document.querySelectorAll(".choice-btn").forEach(btn=>btn.addEventListener("click",()=>setSimulationMultiplier(Number(btn.dataset.multiplier))));
  document.querySelectorAll(".room-btn").forEach(btn=>btn.addEventListener("click",()=>{
    selectedRooms=Number(btn.dataset.rooms);
    document.querySelectorAll(".room-btn").forEach(item=>item.classList.toggle("active",item===btn));
    renderRooms();
    resetAnimatedSimulation();
    renderSimulation();
  }));
  document.querySelector("#royalRate").addEventListener("input",event=>{blueSettings.royalPerRmb=Number(event.target.value)||100;renderPacks();});
  document.querySelector("#blueSource").addEventListener("change",event=>{blueSettings.source=event.target.value;renderPacks();});
  document.querySelector("#customBlueRate").addEventListener("input",event=>{
    blueSettings.customRate=Number(event.target.value)||0;
    if(blueSettings.customRate){blueSettings.exchangePrice=0;document.querySelector("#blueExchangePrice").value="";}
    updateBlueControlState();
    renderPacks();
  });
  document.querySelector("#blueExchangePrice").addEventListener("input",event=>{
    blueSettings.exchangePrice=Number(event.target.value)||0;
    if(blueSettings.exchangePrice){blueSettings.customRate=0;document.querySelector("#customBlueRate").value="";}
    updateBlueControlState();
    renderPacks();
  });
  document.querySelector("#heroStarBoxValueMode").addEventListener("change",event=>{
    heroStarBoxValueMode=starStoneValuation.setMode(event.target.value);
    renderPrices();
    renderPacks();
  });
  document.querySelector("#editStarVeinPageBtn").addEventListener("click",()=>setStarVeinTextEditing(!starVeinTextEditing));
  document.querySelector("#exportStarVeinImageBtn").addEventListener("click",exportStarVeinImage);
  const valueDrawerToggle=document.querySelector("#valueDrawerToggle");
  valueDrawerToggle.addEventListener("click",()=>setValueDrawer(valueDrawerToggle.getAttribute("aria-expanded")!=="true"));
  document.querySelector("#valueDrawerBackdrop").addEventListener("click",()=>setValueDrawer(false));
  document.querySelector("#closeValueDrawer").addEventListener("click",()=>setValueDrawer(false));
  document.addEventListener("input",scheduleStarVeinDraftSave);
  document.addEventListener("change",scheduleStarVeinDraftSave);
  document.addEventListener("click",scheduleStarVeinDraftSave);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&valueDrawerToggle.getAttribute("aria-expanded")==="true")setValueDrawer(false);
    if(event.key==="Escape"&&starVeinTextEditing)setStarVeinTextEditing(false);
  });
  document.querySelector("#closePackModal").addEventListener("click",closePackModal);
  document.querySelector("#packModalBackdrop").addEventListener("click",event=>{if(event.target.id==="packModalBackdrop")closePackModal();});
}
async function initStarVeinPage(){
  if(cachedStarVeinDraft){
    const savedAt=cachedStarVeinDraft.savedAt?new Date(cachedStarVeinDraft.savedAt).toLocaleString("zh-CN"):"上次访问";
    const useCache=await window.LOSTARK_SHARE_EXPORT.confirmCache({
      title:"发现星脉探索缓存",
      message:"检测到当前浏览器保存的星脉探索编辑状态，可以继续上次的内容，或恢复默认数据。",
      detail:`保存时间：${savedAt}`
    });
    if(useCache)restoredStarVeinDraft=cachedStarVeinDraft;
    else localStorage.removeItem(STAR_VEIN_DRAFT_KEY);
  }
  applyStarVeinDraft(restoredStarVeinDraft);
  init();
  initSimulation();
  if(restoredStarVeinDraft)window.LOSTARK_SHARE_EXPORT.showToast("已继续使用浏览器缓存中的星脉探索状态");
}
initStarVeinPage();
