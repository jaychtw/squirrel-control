import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import './style.css';
import {copy,type CopyKey} from './i18n';
import {renderRoom,type Point,type RoomLayout} from './room';
import {makeLayout,selectedIds,freshSeed,seedFromURL} from './placements';
import {Game,TARGET_COUNT,ROUND_MS} from './game';
import {HitMap} from './hit-map';
import {icon} from './icons';
import {loadPreferences,savePreferences,type Preferences} from './preferences';

const app=document.querySelector<HTMLDivElement>('#app')!;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Access to window.localStorage itself may throw in restrictive browsers.
let storage:Storage;
try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}} as unknown as Storage;}
const prefs:Preferences=loadPreferences(storage,reduced.matches);
const t=(key:CopyKey)=>copy[prefs.language][key];
const now=()=>performance.now();
let seed=seedFromURL(location.search)||freshSeed();
let game=new Game(selectedIds(seed));
let mobile=matchMedia('(max-width: 620px)').matches;
let layout=makeLayout(mobile,seed),maps=new Map<boolean,HitMap>();
let preparing=true,prepareError=false,generation=0,magnifier=false;
let point:Point={x:layout.width/2,y:layout.height/2};
let modal:'how'|'guide'|'settings'|'reset'|'paused'|null=null;
let resumeAfterDialog=false,resumeGuide=false,lastFocus:string|null=null;
let down:{x:number;y:number;id:number;dragged:boolean}|undefined;
let lastSecond=-1,paintedStage=-1;
let toastTimeout:ReturnType<typeof setTimeout>,audio:AudioContext|undefined;
const ended=()=>game.phase==='won'||game.phase==='lost';
const timeText=()=>{const seconds=Math.ceil(game.remaining(now())/1000);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
const stageKey=():CopyKey=>(['tidy','playful','messy','chaos','totalMess'] as const)[game.stage(now())];
function persist(){savePreferences(storage,prefs);}
function announce(message:string){const live=document.getElementById('announcer');if(live)live.textContent=message;}
function restoreFocus(action:string|null){
  if(!action)return;
  [...app.querySelectorAll<HTMLElement>(`[data-action="${action}"]:not(:disabled)`)].find(el=>el.getClientRects().length)?.focus({preventScroll:true});
}
function toast(message:string){
  const el=document.getElementById('toast');if(!el)return;
  el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>el.classList.remove('show'),2400);announce(message);
}
function chime(outcome=false){
  if(!prefs.sound)return;
  try{
    audio ||= new AudioContext();void audio.resume().catch(()=>{});
    const at=audio.currentTime;
    for(const [i,frequency] of (outcome?[523,660,784,1047]:[660,880,1100]).entries()){
      const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(0,at+i*.07);gain.gain.linearRampToValueAtTime(.045,at+i*.07+.012);
      gain.gain.exponentialRampToValueAtTime(.001,at+i*.07+.33);
      oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at+i*.07);oscillator.stop(at+i*.07+.36);
    }
  }catch{/* Every cue also has visual/text feedback. */}
}
function header(){return `<header class="site-header"><a class="brand" href="#main-title" aria-label="${t('title')}"><span class="brand-mark">${icon('acorn')}</span><span>${t('title')}<small>${t('brandTagline')}</small></span></a><div class="header-right"><span class="study-badge"><i></i>${t('study')}</span><span class="header-divider"></span><button class="language-button" data-action="language" aria-label="${prefs.language==='en'?'切換為繁體中文':'Switch to English'}"><span aria-hidden="true">文</span> ${prefs.language==='en'?'繁中':'EN'}</button><button class="icon-button sound-button" data-action="sound" aria-label="${prefs.sound?t('soundOn'):t('soundOff')}" aria-pressed="${prefs.sound}">${icon(prefs.sound?'sound':'muted')}</button><button class="icon-button" data-action="settings" aria-label="${t('settings')}">${icon('settings')}</button></div></header>`;}
function dots(){return Array.from({length:TARGET_COUNT},(_,i)=>`<span class="find-dot ${i<game.caught.size?'filled':''}">${i<game.caught.size?icon('check'):''}</span>`).join('');}
function result(){return `<section class="round-result ${game.phase}" aria-labelledby="result-title"><span class="result-emblem" aria-hidden="true">${icon(game.phase==='won'?'check':'leaf')}</span><div><p class="eyebrow">${game.caught.size} / ${TARGET_COUNT} ${t('found')}</p><h2 id="result-title" tabindex="-1">${game.phase==='won'?t('completeTitle'):t('lossTitle')}</h2><p>${game.phase==='won'?t('completeText'):t('lossText')}</p><p class="result-stats">${game.phase==='won'?`${t('timeTaken')} ${(game.elapsed(now())/1000).toFixed(1)} ${t('seconds')}`:`${TARGET_COUNT-game.caught.size} ${t('remaining')}`}</p></div><button class="primary-button" data-action="reset">${t('reset')}${icon('reset')}</button></section>`;}
function render(){
  down=undefined;
  const focusAction=document.activeElement?.getAttribute('data-action')||null;
  const sceneFocused=(document.activeElement as HTMLElement)?.id==='scene';
  document.documentElement.lang=prefs.language;document.documentElement.dataset.motion=String(prefs.motion);document.documentElement.dataset.text=prefs.largeText?'large':'normal';
  document.title=`${t('title')} — ${t('room')}`;
  app.innerHTML=`${header()}<main><section class="introduction" aria-labelledby="main-title"><div><p class="eyebrow">${t('eyebrow')}</p><h1 id="main-title">${t('headline')} <em>${t('headlineEm')}</em><span class="title-spark" aria-hidden="true">✻</span></h1></div><p class="intro-copy">${t('intro').replace('\n','<br>')}</p></section>
  <section class="game-card" data-phase="${game.phase}" aria-label="${t('room')}"><div class="room-header"><div class="room-title"><span class="room-number">${t('roomNumber')}</span><h2>${t('room')}</h2><span class="room-subtitle">${t('subtitle')}</span></div><div class="hud"><div class="timer" aria-label="${t('timer')}: ${timeText()}"><span class="timer-clock" aria-hidden="true"></span><div><strong>${timeText()}</strong><small>${t('timerNote')}</small></div></div><div class="hud-divider"></div><div class="counter" aria-label="${game.caught.size} ${t('of')} ${TARGET_COUNT} ${t('srCount')}"><span class="counter-top"><strong>${game.caught.size}<span> / ${TARGET_COUNT}</span></strong><small>${t('found')}</small></span><span class="find-dots" aria-hidden="true">${dots()}</span></div></div></div>
  <div class="scene-wrap ${game.phase==='idle'?'':'is-playing'} ${magnifier?'inspecting':''}"><div id="scene" class="scene" role="application" tabindex="0" aria-label="${t('sceneLabel')}" aria-describedby="scene-help" aria-busy="${preparing}" aria-disabled="${game.phase!=='running'}"></div><div id="lens" class="lens" role="img" aria-label="${t('lensLabel')}" hidden><div id="lens-art"></div><span class="lens-cross" aria-hidden="true"></span></div><div id="catch-particles" aria-hidden="true"></div><div id="toast" role="status" class="toast"></div>
  ${game.phase==='idle'?`<span class="sr-only" id="scene-help">${t('huntTip')}</span><div class="welcome-card"><span class="welcome-icon" aria-hidden="true">${icon('leaf')}</span><div><span class="mini-label">${t('demo')}</span><p>${prepareError?t('loadError'):t('demoText')}</p></div><button class="primary-button" data-action="${prepareError?'retry-load':'begin'}" ${preparing?'disabled':''}>${preparing?t('loading'):prepareError?t('retryLoad'):t('explore')}${icon('arrow')}</button></div>`:`<div class="scene-note" id="scene-help">${icon('search')}<span>${ended()?(game.phase==='won'?t('completeTitle'):t('timeUp')):magnifier?(mobile?t('touchLensHint'):t('lensHint')):t('huntTip')}</span></div>`}</div>
  <div class="room-toolbar"><div class="tool-left"><button class="magnify-button ${magnifier?'active':''}" data-action="magnify" aria-pressed="${magnifier}" ${game.phase!=='running'?'disabled':''}>${icon('search')}<span>${magnifier?t('magnifyOn'):t('magnify')}</span><kbd>M</kbd></button><span class="magnify-caption">${t('magnifyHint')}</span></div><div class="round-tools"><span class="mood-readout"><span class="mini-label">${t('mood')}</span><strong id="mood-name">${t(stageKey())}</strong></span><button class="secondary-button pause-button" data-action="pause" ${game.phase!=='running'?'disabled':''}>${icon('pause')}${t('pause')}</button><button class="icon-button toolbar-reset" data-action="reset" aria-label="${t('replayLabel')}" ${preparing?'disabled':''}>${icon('reset')}</button></div></div><div class="time-track" aria-hidden="true"><span id="time-bar"></span></div></section>
  ${ended()?result():`<section class="below-room"><div class="bunny-note"><span class="little-flower" aria-hidden="true">✿</span><div><h3>${t('welcome')}</h3><p>${t('status')}</p></div></div><div class="room-links"><button class="text-button" data-action="guide">${icon('book')}${t('guide')}</button><button class="text-button" data-action="how">${icon('help')}${t('how')}</button></div></section>`}
  ${ended()?`<div class="end-links"><button class="text-button" data-action="how">${icon('help')}${t('how')}</button></div>`:''}<p class="preview-note">${t('previewNote')}</p></main><footer><span>${icon('leaf')}${t('footer')}</span><span>${t('footnote')}</span></footer><div class="sr-only" id="announcer" aria-live="polite" aria-atomic="true"></div><div id="dialog-host"></div>`;
  paintScene();updateClock();
  if(modal){renderDialog();restoreFocus(focusAction);}
  else if(sceneFocused)document.getElementById('scene')?.focus({preventScroll:true});
  else restoreFocus(focusAction);
}
function paintScene(){
  const scene=document.getElementById('scene')!;paintedStage=game.stage(now());
  scene.innerHTML=renderRoom(layout,game.caught,paintedStage,game.phase);
  scene.dataset.stage=String(paintedStage);scene.dataset.seed=seed;
  scene.dataset.visibility=JSON.stringify(maps.get(mobile)?.visibility.filter(v=>!game.caught.has(v.id))||[]);
  const art=document.getElementById('lens-art')!;art.innerHTML=scene.innerHTML;art.setAttribute('aria-hidden','true');updateLens();
}
async function prepareRound(code:string,autoStart=false){
  const token=++generation;seed=code;game=new Game(selectedIds(seed));maps=new Map();preparing=true;prepareError=false;modal=null;down=undefined;magnifier=false;
  layout=makeLayout(mobile,seed);point={x:layout.width/2,y:layout.height/2};render();
  try{
    const prepared=await Promise.all([false,true].map(async portrait=>{
      const room=makeLayout(portrait,code),container=document.createElement('div');
      container.innerHTML=renderRoom(room,new Set(),0);
      const mask=await HitMap.create(container.querySelector('svg')!,room.width,room.height,room.targets);
      if(mask.overlappingIds.length||mask.visibility.length!==TARGET_COUNT||mask.visibility.some(v=>v.ratio<.3||v.cropped||!v.visiblePoint))throw new Error('Invalid authored room placement');
      return [portrait,mask] as const;
    }));
    if(token!==generation)return;
    maps=new Map(prepared);preparing=false;
    if(autoStart&&!document.hidden)game.start(now());
    render();
    if(autoStart)document.getElementById('scene')?.focus({preventScroll:true});
  }catch(error){if(token!==generation)return;preparing=false;prepareError=true;console.error('Room preparation failed',error);render();}
}
function updateClock(){
  const value=timeText();document.querySelector('.timer strong')!.textContent=value;
  document.querySelector('.timer')!.setAttribute('aria-label',`${t('timer')}: ${value}`);
  document.querySelector('.timer')!.classList.toggle('low-time',game.phase==='running'&&game.remaining(now())<=10000);
  const guide=document.querySelector('.guide-clock');if(guide)guide.textContent=`${t('timer')}: ${value} · ${game.caught.size}/${TARGET_COUNT}`;
  document.getElementById('time-bar')!.style.width=`${game.remaining(now())/ROUND_MS*100}%`;
  lastSecond=Math.ceil(game.remaining(now())/1000);
}
function finish(){
  modal=null;resumeAfterDialog=false;resumeGuide=false;down=undefined;magnifier=false;render();
  if(game.phase==='won')chime(true);
  document.getElementById('result-title')?.focus({preventScroll:true});
  toast(game.phase==='won'?t('completeText'):t('timeUp'));
}
function settle(){const before=game.phase;game.sync(now());if(before==='running'&&game.phase==='lost'){finish();return true;}return false;}
function frame(){
  if(game.phase==='running'){
    if(!settle()){
      if(game.stage(now())!==paintedStage){paintScene();document.getElementById('mood-name')!.textContent=t(stageKey());}
      const second=Math.ceil(game.remaining(now())/1000);
      if(second!==lastSecond){updateClock();if(second===10)announce(t('urgent'));}
    }
  }
  requestAnimationFrame(frame);
}
function catchGuest(id:string,p?:Point,fromGuide=false){
  if(preparing||modal&&!fromGuide)return;
  const accepted=game.catch(id,now());
  if(game.phase==='lost'){finish();return;}
  if(!accepted)return;
  if(game.phase==='won'){finish();return;}
  chime();render();toast(`${t('foundToast')} ${game.caught.size}/${TARGET_COUNT}`);
  if(fromGuide){document.querySelector<HTMLElement>('dialog [data-action^="catch-"]:not(:disabled)')?.focus({preventScroll:true});}
  if(p&&prefs.motion){
    const scene=document.getElementById('scene')!,x=p.x/layout.width*scene.clientWidth,y=p.y/layout.height*scene.clientHeight;
    document.getElementById('catch-particles')!.innerHTML=Array.from({length:6},(_,i)=>`<span class="catch-spark" style="left:${x}px;top:${y}px;--dx:${Math.cos(i*Math.PI/3)*38}px;--dy:${Math.sin(i*Math.PI/3)*38}px;--r:${i*42}deg">${i%2?'✦':'·'}</span>`).join('');
  }
}
function fromEvent(e:PointerEvent):Point{const r=document.getElementById('scene')!.getBoundingClientRect();return{x:Math.max(0,Math.min(layout.width-1,(e.clientX-r.left)/r.width*layout.width)),y:Math.max(0,Math.min(layout.height-1,(e.clientY-r.top)/r.height*layout.height))};}
function updateLens(){
  const lens=document.getElementById('lens'),art=document.getElementById('lens-art'),scene=document.getElementById('scene');if(!lens||!art||!scene)return;
  lens.hidden=!magnifier||game.phase!=='running'||!!modal;if(lens.hidden)return;
  const width=scene.clientWidth,height=scene.clientHeight,diameter=mobile?146:174,zoom=2.25;
  const x=point.x/layout.width*width,y=point.y/layout.height*height;
  const left=mobile?width-diameter-14:Math.max(12,Math.min(width-diameter-12,x+(x>width*.67?-diameter-32:36)));
  const top=mobile?(y<diameter+70?height-diameter-56:18):Math.max(12,Math.min(height-diameter-12,y-diameter-20));
  lens.style.cssText=`width:${diameter}px;height:${diameter}px;left:${left}px;top:${top}px;`;
  art.style.cssText=`width:${width*zoom}px;height:${height*zoom}px;transform:translate(${diameter/2-x*zoom-6}px,${diameter/2-y*zoom-6}px)`;
}
function openDialog(kind:NonNullable<typeof modal>){
  if(settle()&&kind==='paused')return;
  lastFocus=document.activeElement?.getAttribute('data-action')||'pause';
  resumeGuide=modal==='guide';resumeAfterDialog=false;
  if(kind!=='guide'&&game.phase==='running')resumeAfterDialog=game.pause(now());
  modal=kind;down=undefined;render();
}
function renderDialog(){
  const host=document.getElementById('dialog-host')!;let content='';
  if(modal==='how')content=`<span class="dialog-symbol">${icon('help')}</span><h2 id="dialog-title">${t('howTitle')}</h2><p>${t('howIntro')}</p><ol class="instructions">${[1,2,3,4].map(i=>`<li><span>${String(i).padStart(2,'0')}</span><div><h3>${t(`how${i}` as CopyKey)}</h3><p>${t(`how${i}Text` as CopyKey)}</p></div></li>`).join('')}</ol>`;
  if(modal==='guide')content=`<span class="dialog-symbol">${icon('book')}</span><h2 id="dialog-title">${t('guideTitle')}</h2><p>${t('guideIntro')}</p><p class="guide-clock">${t('timer')}: ${timeText()} · ${game.caught.size}/${TARGET_COUNT}</p>${game.phase==='running'?`<button class="text-button" data-action="pause">${icon('pause')}${t('pause')}</button>`:''}<ul class="clue-list">${layout.targets.map((target,i)=>`<li><span class="clue-number">${String(i+1).padStart(2,'0')}</span><div><p>${t(target.clue as CopyKey)}</p><button class="text-button" data-action="catch-${target.id}" ${game.caught.has(target.id)||game.phase!=='running'?'disabled':''}>${icon(game.caught.has(target.id)?'check':'arrow')}${game.caught.has(target.id)?t('caught'):t('catch')}</button></div></li>`).join('')}</ul>${game.phase==='idle'?`<button class="primary-button" data-action="begin-guide" ${preparing||prepareError?'disabled':''}>${t('explore')}${icon('arrow')}</button>`:''}`;
  if(modal==='settings')content=`<span class="dialog-symbol">${icon('settings')}</span><h2 id="dialog-title">${t('settingsTitle')}</h2>${(['motion','sound','largeText'] as const).map(key=>`<div class="setting-row"><div><h3>${t(key)}</h3><p>${t(`${key}Desc` as CopyKey)}</p></div><button class="switch ${prefs[key]?'on':''}" role="switch" aria-label="${t(key)}" aria-checked="${prefs[key]}" data-action="${key}"><span></span></button></div>`).join('')}<div class="room-code"><label for="room-code">${t('roomCode')}</label><input id="room-code" readonly value="${seed}"/><button class="text-button" data-action="copy-code">${t('copyCode')}</button></div>`;
  if(modal==='reset')content=`<span class="dialog-symbol">${icon('reset')}</span><h2 id="dialog-title">${t('restart')}</h2><p>${t('resetConfirm')}</p><div class="dialog-actions"><button class="secondary-button" data-action="close">${t('cancel')}</button><button class="primary-button" data-action="confirm-reset">${t('confirm')}${icon('reset')}</button></div>`;
  if(modal==='paused')content=`<span class="dialog-symbol">${icon('leaf')}</span><h2 id="dialog-title">${t('paused')}</h2><p>${t('pausedText')}</p><button class="primary-button" data-action="close">${t('resume')}${icon('arrow')}</button>`;
  host.innerHTML=`<dialog aria-labelledby="dialog-title"><button class="icon-button dialog-close" data-action="close" aria-label="${t('close')}">${icon('close')}</button>${content}</dialog>`;
  const dialog=host.querySelector('dialog')!;dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  dialog.showModal();
}
function closeDialog(){
  const previous=modal;document.querySelector('dialog')?.close();document.getElementById('dialog-host')!.innerHTML='';modal=null;
  if(game.phase==='paused'&&(resumeAfterDialog||previous==='paused')){
    if(document.hidden){modal='paused';render();return;}
    game.resume(now());resumeAfterDialog=false;
  }
  if(previous==='paused'&&resumeGuide&&game.phase==='running'){modal='guide';resumeGuide=false;}
  render();if(!modal)restoreFocus(lastFocus);
}
function begin(guide=false){
  if(preparing||prepareError||game.phase!=='idle')return;
  game.start(now());modal=guide?'guide':null;resumeAfterDialog=false;render();
  if(!guide)document.getElementById('scene')?.focus({preventScroll:true});
}
function reset(){
  let code=freshSeed(seed),attempt=0;
  const previous=[...game.ids].sort().join(',');
  while(selectedIds(code).sort().join(',')===previous&&attempt++<16)code=freshSeed(code);
  void prepareRound(code,true);
}
app.addEventListener('click',e=>{
  const button=(e.target as Element).closest<HTMLButtonElement>('[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action!;
  if(action==='language'){prefs.language=prefs.language==='en'?'zh-TW':'en';persist();render();announce(t('switched'));}
  else if(action==='sound'||action==='motion'||action==='largeText'){prefs[action]=!prefs[action];persist();render();if(action==='sound'&&prefs.sound)chime();}
  else if(action==='begin'||action==='begin-guide')begin(action==='begin-guide');
  else if(action==='magnify'){if(game.phase==='running'){magnifier=!magnifier;render();}}
  else if(action==='pause')openDialog('paused');
  else if(action==='reset'){if(game.phase==='running'||game.phase==='paused')openDialog('reset');else reset();}
  else if(action==='confirm-reset')reset();
  else if(action==='close')closeDialog();
  else if(action==='how'||action==='guide'||action==='settings')openDialog(action);
  else if(action.startsWith('catch-')&&modal==='guide')catchGuest(action.slice(6),undefined,true);
  else if(action==='retry-load')void prepareRound(seed);
  else if(action==='copy-code'){if(navigator.clipboard)void navigator.clipboard.writeText(seed).then(()=>toast(t('copied'))).catch(()=>toast(t('copyUnavailable')));else{document.querySelector<HTMLInputElement>('#room-code')?.select();toast(t('copyUnavailable'));}}
});
app.addEventListener('pointerdown',e=>{
  if(!(e.target as Element).closest('#scene')||!e.isPrimary||preparing||game.phase!=='running'||modal||down)return;
  down={x:e.clientX,y:e.clientY,dragged:false,id:e.pointerId};point=fromEvent(e);updateLens();
  document.getElementById('scene')!.setPointerCapture(e.pointerId);
});
app.addEventListener('pointermove',e=>{
  if(!(e.target as Element).closest('#scene')||game.phase!=='running'||modal)return;
  if(down&&down.id!==e.pointerId)return;
  if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)down.dragged=true;
  point=fromEvent(e);updateLens();
});
app.addEventListener('pointerup',e=>{
  if(!down||down.id!==e.pointerId)return;const dragged=down.dragged;down=undefined;
  if(dragged||preparing||modal||game.phase!=='running')return;
  point=fromEvent(e);const id=maps.get(mobile)?.hit(point.x,point.y);
  if(id&&!game.caught.has(id))catchGuest(id,point);else if(!settle())toast(t('missToast'));
});
app.addEventListener('pointercancel',()=>{down=undefined;});
app.addEventListener('lostpointercapture',()=>{down=undefined;},true);
window.addEventListener('blur',()=>{down=undefined;});
window.addEventListener('pointerup',()=>{down=undefined;});
app.addEventListener('keydown',e=>{
  if(modal||e.target instanceof HTMLInputElement)return;
  if(e.key.toLowerCase()==='p'&&game.phase==='running'){e.preventDefault();openDialog('paused');return;}
  if(e.key==='Escape'&&magnifier){magnifier=false;render();return;}
  if(e.key.toLowerCase()==='m'&&game.phase==='running'){e.preventDefault();magnifier=!magnifier;render();document.getElementById('scene')?.focus({preventScroll:true});return;}
  if((e.target as HTMLElement).id!=='scene'||game.phase!=='running')return;
  const directions:Record<string,Point>={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}};
  if(directions[e.key]){
    e.preventDefault();magnifier=true;const step=e.shiftKey?35:8;
    point.x=Math.max(0,Math.min(layout.width-1,point.x+directions[e.key].x*step));point.y=Math.max(0,Math.min(layout.height-1,point.y+directions[e.key].y*step));
    const button=document.querySelector('[data-action="magnify"]')!;button.setAttribute('aria-pressed','true');button.classList.add('active');button.querySelector('span')!.textContent=t('magnifyOn');updateLens();
  }
  if(e.key==='Enter'||e.key===' '){e.preventDefault();const id=maps.get(mobile)?.hit(point.x,point.y);if(id&&!game.caught.has(id))catchGuest(id,point);else if(!settle())toast(t('missToast'));}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='running')openDialog('paused');});
new ResizeObserver(updateLens).observe(app);
matchMedia('(max-width: 620px)').addEventListener('change',event=>{
  mobile=event.matches;layout=makeLayout(mobile,seed);point={x:layout.width/2,y:layout.height/2};down=undefined;render();
});
reduced.addEventListener('change',event=>{if(event.matches){prefs.motion=false;document.documentElement.dataset.motion='false';}});
void prepareRound(seed);requestAnimationFrame(frame);
