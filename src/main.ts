import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import './style.css';
import { copy, type CopyKey, type Language } from './i18n';
import { makeLayout, renderRoom, type Point } from './room';
import { HitMap } from './hit-map';

const icons: Record<string, string> = {
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5M8 11h6M11 8v6"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4V4ZM15 8q4 4 0 8M18 5q7 7 0 14"/>',
  muted: '<path d="M11 4 6 8H3v8h3l5 4V4ZM16 9l6 6M22 9l-6 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
  leaf: '<path d="M5 21C2 8 9 3 21 3c0 11-5 17-14 15M5 21 16 9"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M4 12h16m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  book: '<path d="M12 5v15M12 5Q6 1 2 5v14q5-3 10 1 5-4 10-1V5q-5-4-10 0Z"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/>',
  acorn: '<path d="M5 11q-1 8 7 11 8-3 7-11M3 11q0-8 9-8t9 8H3ZM12 3q0-3 3-3"/>',
};
const icon = (name: string, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icon ${cls}">${icons[name] || icons.leaf}</svg>`;
const app = document.querySelector<HTMLDivElement>('#app')!;
let language: Language = 'en', motion = !matchMedia('(prefers-reduced-motion: reduce)').matches, sound = false;
try {
  const saved = JSON.parse(localStorage.getItem('squirrel-preferences') || '{}');
  if (saved.language === 'zh-TW' || saved.language === 'en') language = saved.language;
  if (typeof saved.motion === 'boolean') motion = saved.motion && motion;
  if (typeof saved.sound === 'boolean') sound = saved.sound;
} catch { /* Storage is optional; a blocked or corrupt store must never prevent play. */ }
let started = false, magnifier = false, stage = 0;
const caught = new Set<string>();
let mobile = matchMedia('(max-width: 620px)').matches;
let layout = makeLayout(mobile), map: HitMap | undefined;
let renderVersion = 0, modal: 'how' | 'guide' | 'settings' | 'reset' | 'paused' | null = null;
let lastFocus: string | null = null;
let point: Point = { x: layout.width / 2, y: layout.height / 2 };
let down: { x: number; y: number; dragged: boolean; id: number } | undefined;
let toastTimeout: ReturnType<typeof setTimeout>;
let audio: AudioContext | undefined;
const t = (key: CopyKey) => copy[language][key];
function savePreferences() { try { localStorage.setItem('squirrel-preferences', JSON.stringify({ language, motion, sound })); } catch { /* Session preferences still work. */ } }
function announce(message: string) { const live = document.getElementById('announcer'); if (live) live.textContent = message; }
function toast(message: string) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.classList.remove('show'), 2600);
  announce(message);
}
function chime() {
  if (!sound) return;
  try {
    audio ||= new AudioContext();
    void audio.resume();
    const at = audio.currentTime;
    for (const [i, frequency] of [660, 880, 1100].entries()) {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at + i * .065); gain.gain.linearRampToValueAtTime(.055, at + i * .065 + .012);
      gain.gain.exponentialRampToValueAtTime(.001, at + i * .065 + .35);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(at + i * .065); oscillator.stop(at + i * .065 + .4);
    }
  } catch { /* No-audio browsers retain all visual feedback. */ }
}
function header() {
  return `<header class="site-header"><a class="brand" href="./" aria-label="${t('title')}"><span class="brand-mark">${icon('acorn')}</span><span>${t('title')}<small>${t('brandTagline')}</small></span></a>
    <div class="header-right"><span class="study-badge"><i></i>${t('study')}</span><span class="header-divider"></span>
    <button class="language-button" data-action="language" aria-label="${language === 'en' ? '切換為繁體中文' : 'Switch to English'}"><span aria-hidden="true">文</span> ${language === 'en' ? '繁中' : 'EN'}</button>
    <button class="icon-button sound-button" data-action="sound" aria-label="${sound ? t('soundOn') : t('soundOff')}" aria-pressed="${sound}">${icon(sound ? 'sound' : 'muted')}</button>
    <button class="icon-button" data-action="settings" aria-label="${t('settings')}">${icon('settings')}</button></div></header>`;
}
function dots() { return Array.from({ length: 4 }, (_, i) => `<span class="find-dot ${i < caught.size ? 'filled' : ''}">${i < caught.size ? icon('check') : ''}</span>`).join(''); }
function render() {
  const focusId = document.activeElement?.getAttribute('data-action');
  document.documentElement.lang = language;
  document.documentElement.dataset.motion = String(motion);
  document.title = `${t('title')} — ${t('room')}`;
  app.innerHTML = `${header()}<main>
    <section class="introduction" aria-labelledby="main-title"><div><p class="eyebrow">${t('eyebrow')}</p><h1 id="main-title">${t('headline')} <em>${t('headlineEm')}</em><span class="title-spark" aria-hidden="true">✻</span></h1></div><p class="intro-copy">${t('intro').replace('\n', '<br>')}</p></section>
    <section class="game-card" aria-label="${t('room')}"><div class="room-header"><div class="room-title"><span class="room-number">${t('roomNumber')}</span><h2>${t('room')}</h2><span class="room-subtitle">${t('subtitle')}</span></div>
      <div class="hud"><div class="timer" aria-label="${t('timer')}, ${t('timerNote')}"><span class="timer-clock" aria-hidden="true"></span><div><strong>01:00</strong><small>${t('timerNote')}</small></div></div><div class="hud-divider"></div><div class="counter" aria-label="${caught.size} ${t('of')} 4 ${t('srCount')}"><span class="counter-top"><strong>${caught.size}<span> / 4</span></strong><small>${t('found')}</small></span><span class="find-dots" aria-hidden="true">${dots()}</span></div>
      <button class="icon-button reset-button" data-action="reset" aria-label="${t('replayLabel')}">${icon('reset')}</button></div></div>
      <div class="scene-wrap ${started ? 'is-playing' : ''} ${magnifier ? 'inspecting' : ''}"><div id="scene" class="scene" role="application" tabindex="0" aria-label="${t('sceneLabel')}" aria-describedby="scene-help" aria-busy="true"></div>
        <div id="lens" class="lens" role="img" aria-label="${t('lensLabel')}" hidden><div id="lens-art"></div><span class="lens-cross" aria-hidden="true"></span></div>
        <div id="catch-particles" aria-hidden="true"></div><div id="toast" role="status" class="toast"></div>
        ${!started ? `<span class="sr-only" id="scene-help">${t('huntTip')}</span><div class="welcome-card"><span class="welcome-icon" aria-hidden="true">${icon('leaf')}</span><div><span class="mini-label">${t('demo')}</span><p>${t('demoText')}</p></div><button class="primary-button" data-action="begin">${t('explore')}${icon('arrow')}</button></div>` : `<div class="scene-note" id="scene-help">${icon('search')}<span>${magnifier ? (mobile ? t('touchLensHint') : t('lensHint')) : t('huntTip')}</span></div>`}
      </div>
      <div class="room-toolbar"><div class="tool-left"><button class="magnify-button ${magnifier ? 'active' : ''}" data-action="magnify" aria-pressed="${magnifier}">${icon('search')}<span>${magnifier ? t('magnifyOn') : t('magnify')}</span><kbd>M</kbd></button><span class="magnify-caption">${t('magnifyHint')}</span></div><div class="mood-control" role="group" aria-label="${t('mood')}"><span class="mini-label">${t('mood')}</span><div class="segmented">${(['tidy', 'playful', 'chaos'] as const).map((key, i) => `<button data-action="stage-${i}" aria-pressed="${stage === i}" class="${stage === i ? 'selected' : ''}"><span class="mood-dot mood-${i}" aria-hidden="true"></span>${t(key)}</button>`).join('')}</div></div></div>
    </section>
    <section class="below-room"><div class="bunny-note"><span class="little-flower" aria-hidden="true">✿</span><div><h3>${caught.size === 4 ? t('completeTitle') : t('welcome')}</h3><p>${caught.size === 4 ? t('completeText') : t('status')}</p></div>${caught.size === 4 ? `<button class="text-button" data-action="reset">${t('reset')}${icon('reset')}</button>` : ''}</div><div class="room-links"><button class="text-button" data-action="guide">${icon('book')}${t('guide')}</button><button class="text-button" data-action="how">${icon('help')}${t('how')}</button></div></section>
    <p class="preview-note">${t('previewNote')}</p>
    </main><footer><span>${icon('leaf')}${t('footer')}</span><span>${t('footnote')}</span></footer>
    <div class="sr-only" id="announcer" aria-live="polite" aria-atomic="true"></div><div id="dialog-host"></div>`;
  void paintScene();
  if (modal) {
    showModal(modal, false);
    if (focusId) document.querySelector<HTMLElement>(`dialog [data-action="${focusId}"]:not(:disabled)`)?.focus({ preventScroll: true });
  }
  else if (focusId) app.querySelector<HTMLElement>(`[data-action="${focusId}"]`)?.focus({ preventScroll: true });
}
async function paintScene() {
  const version = ++renderVersion;
  map = undefined;
  const scene = document.getElementById('scene')!;
  scene.innerHTML = renderRoom(layout, caught, stage);
  const svg = scene.querySelector<SVGElement>('svg')!;
  try {
    const nextMap = await HitMap.create(svg, layout.width, layout.height, layout.targets);
    if (version !== renderVersion) return;
    map = nextMap;
    scene.setAttribute('aria-busy', 'false');
    // Developer-visible diagnostic data has no effect on play or target rendering.
    scene.dataset.visibility = JSON.stringify(map.visibility);
    const lensArt = document.getElementById('lens-art')!;
    lensArt.innerHTML = svg.outerHTML;
    lensArt.setAttribute('aria-hidden', 'true');
    updateLens();
  } catch (error) { console.error('Unable to prepare the room hit mask', error); }
}
function catchGuest(id: string, p?: Point) {
  if (!started || modal || caught.has(id)) return;
  caught.add(id); chime();
  render();
  toast(caught.size === 4 ? t('completeText') : t('foundToast'));
  if (p && motion) {
    const particles = document.getElementById('catch-particles')!;
    const scene = document.getElementById('scene')!;
    const x = p.x / layout.width * scene.clientWidth, y = p.y / layout.height * scene.clientHeight;
    particles.innerHTML = Array.from({ length: 6 }, (_, i) => `<span class="catch-spark" style="left:${x}px;top:${y}px;--dx:${Math.cos(i * Math.PI / 3) * 38}px;--dy:${Math.sin(i * Math.PI / 3) * 38}px;--r:${i * 42}deg">${i % 2 ? '✦' : '·'}</span>`).join('');
  }
}
function fromEvent(e: PointerEvent): Point {
  const rect = document.getElementById('scene')!.getBoundingClientRect();
  return { x: Math.max(0, Math.min(layout.width - 1, (e.clientX - rect.left) / rect.width * layout.width)), y: Math.max(0, Math.min(layout.height - 1, (e.clientY - rect.top) / rect.height * layout.height)) };
}
function updateLens() {
  const lens = document.getElementById('lens')!, art = document.getElementById('lens-art')!, scene = document.getElementById('scene')!;
  if (!lens || !art) return;
  lens.hidden = !magnifier || !started || !!modal;
  if (lens.hidden) return;
  const width = scene.clientWidth, height = scene.clientHeight, diameter = mobile ? 146 : 174, zoom = 2.25;
  const x = point.x / layout.width * width, y = point.y / layout.height * height;
  const left = mobile ? width - diameter - 14 : Math.max(12, Math.min(width - diameter - 12, x + (x > width * .67 ? -diameter - 32 : 36)));
  const top = mobile ? (y < diameter + 70 ? height - diameter - 56 : 18) : Math.max(12, Math.min(height - diameter - 12, y - diameter - 20));
  lens.style.cssText = `width:${diameter}px;height:${diameter}px;left:${left}px;top:${top}px;`;
  art.style.cssText = `width:${width * zoom}px;height:${height * zoom}px;transform:translate(${diameter / 2 - x * zoom - 6}px,${diameter / 2 - y * zoom - 6}px)`;
}
function showModal(kind: NonNullable<typeof modal>, remember = true) {
  if (remember) lastFocus = document.activeElement?.getAttribute('data-action') || null;
  modal = kind;
  const host = document.getElementById('dialog-host')!;
  let content = '';
  if (kind === 'how') content = `<span class="dialog-symbol">${icon('help')}</span><h2 id="dialog-title">${t('howTitle')}</h2><p>${t('howIntro')}</p><ol class="instructions">${[1,2,3,4].map(i => `<li><span>${String(i).padStart(2,'0')}</span><div><h3>${t(`how${i}` as CopyKey)}</h3><p>${t(`how${i}Text` as CopyKey)}</p></div></li>`).join('')}</ol>`;
  if (kind === 'guide') content = `<span class="dialog-symbol">${icon('book')}</span><h2 id="dialog-title">${t('guideTitle')}</h2><p>${t('guideIntro')}</p><ul class="clue-list">${layout.targets.map((target, i) => `<li><span class="clue-number">0${i+1}</span><div><p>${t(target.clue as CopyKey)}</p><button class="text-button" data-action="catch-${target.id}" ${caught.has(target.id) || !started ? 'disabled' : ''}>${icon(caught.has(target.id) ? 'check' : 'arrow')}${caught.has(target.id) ? t('caught') : t('catch')}</button></div></li>`).join('')}</ul>${!started ? `<button class="primary-button" data-action="begin">${t('explore')}${icon('arrow')}</button>` : ''}`;
  if (kind === 'settings') content = `<span class="dialog-symbol">${icon('settings')}</span><h2 id="dialog-title">${t('settingsTitle')}</h2><div class="setting-row"><div><h3>${t('motion')}</h3><p>${t('motionDesc')}</p></div><button class="switch ${motion ? 'on' : ''}" role="switch" aria-label="${t('motion')}" aria-checked="${motion}" data-action="motion"><span></span></button></div><div class="setting-row"><div><h3>${t('sound')}</h3><p>${t('soundDesc')}</p></div><button class="switch ${sound ? 'on' : ''}" role="switch" aria-label="${t('sound')}" aria-checked="${sound}" data-action="sound"><span></span></button></div>`;
  if (kind === 'reset') content = `<span class="dialog-symbol">${icon('reset')}</span><h2 id="dialog-title">${t('reset')}</h2><p>${t('resetConfirm')}</p><div class="dialog-actions"><button class="secondary-button" data-action="close">${t('cancel')}</button><button class="primary-button" data-action="confirm-reset">${t('confirm')}${icon('reset')}</button></div>`;
  if (kind === 'paused') content = `<span class="dialog-symbol">${icon('leaf')}</span><h2 id="dialog-title">${t('paused')}</h2><p>${t('pausedText')}</p><button class="primary-button" data-action="close">${t('resume')}${icon('arrow')}</button>`;
  host.innerHTML = `<dialog aria-labelledby="dialog-title"><button class="icon-button dialog-close" data-action="close" aria-label="${t('close')}">${icon('close')}</button>${content}</dialog>`;
  const dialog = host.querySelector('dialog')!;
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeModal(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if ((e as MouseEvent).clientX < r.left || (e as MouseEvent).clientX > r.right || (e as MouseEvent).clientY < r.top || (e as MouseEvent).clientY > r.bottom) closeModal(); } });
  dialog.showModal(); updateLens();
}
function closeModal() {
  document.querySelector('dialog')?.close();
  document.getElementById('dialog-host')!.innerHTML = ''; modal = null;
  if (lastFocus) app.querySelector<HTMLElement>(`[data-action="${lastFocus}"]`)?.focus({ preventScroll: true });
  updateLens();
}
app.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action!;
  if (action === 'language') { language = language === 'en' ? 'zh-TW' : 'en'; savePreferences(); render(); announce(t('switched')); }
  else if (action === 'sound') { sound = !sound; savePreferences(); render(); if (sound) chime(); }
  else if (action === 'motion') { motion = !motion; savePreferences(); render(); }
  else if (action === 'begin') { modal = null; started = true; render(); document.getElementById('scene')?.focus({ preventScroll: true }); }
  else if (action === 'magnify') { started = true; magnifier = !magnifier; render(); }
  else if (action === 'reset') { if (caught.size > 0 && caught.size < 4) showModal('reset'); else reset(); }
  else if (action === 'confirm-reset') reset();
  else if (action === 'close') closeModal();
  else if (['how', 'guide', 'settings'].includes(action)) showModal(action as NonNullable<typeof modal>);
  else if (action.startsWith('stage-')) { stage = Number(action.slice(-1)); render(); }
  else if (action.startsWith('catch-')) { modal = null; catchGuest(action.slice(6)); showModal('guide', false); }
});
function reset() { caught.clear(); stage = 0; started = true; modal = null; render(); document.getElementById('scene')?.focus({ preventScroll: true }); }
app.addEventListener('pointerdown', e => {
  if (!(e.target as Element).closest('#scene') || !started || modal || !map) return;
  down = { x: e.clientX, y: e.clientY, dragged: false, id: e.pointerId };
  point = fromEvent(e); updateLens();
  (e.target as Element).closest('#scene')!.setPointerCapture(e.pointerId);
});
app.addEventListener('pointermove', e => {
  if (!(e.target as Element).closest('#scene') || !started || modal) return;
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.dragged = true;
  point = fromEvent(e); updateLens();
});
app.addEventListener('pointerup', e => {
  if (!down || down.id !== e.pointerId) return;
  const dragged = down.dragged; down = undefined;
  if (dragged || !started || modal || !map) return;
  point = fromEvent(e);
  const id = map.hit(point.x, point.y);
  if (id) catchGuest(id, point);
  else toast(t('missToast'));
});
app.addEventListener('pointercancel', () => { down = undefined; });
app.addEventListener('keydown', e => {
  if (modal) return;
  if (e.key === 'Escape' && magnifier) { magnifier = false; render(); return; }
  if (e.key.toLowerCase() === 'm' && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); started = true; magnifier = !magnifier; render(); document.getElementById('scene')?.focus({ preventScroll: true }); return; }
  if ((e.target as HTMLElement).id !== 'scene' || !started) return;
  const direction: Record<string, Point> = { ArrowLeft: {x:-1,y:0}, ArrowRight:{x:1,y:0}, ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1} };
  if (direction[e.key]) {
    e.preventDefault(); magnifier = true;
    const step = e.shiftKey ? 35 : 8;
    point.x = Math.max(0,Math.min(layout.width-1,point.x+direction[e.key].x*step)); point.y = Math.max(0,Math.min(layout.height-1,point.y+direction[e.key].y*step));
    app.querySelector('[data-action="magnify"]')?.setAttribute('aria-pressed','true');
    updateLens();
  }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const id = map?.hit(point.x, point.y); if (id) { catchGuest(id, point); document.getElementById('scene')?.focus({ preventScroll: true }); } else toast(t('missToast')); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && started && !modal) showModal('paused'); });
new ResizeObserver(() => { updateLens(); }).observe(app);
matchMedia('(max-width: 620px)').addEventListener('change', event => {
  mobile = event.matches; layout = makeLayout(mobile); point = { x: layout.width / 2, y: layout.height / 2 }; render();
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) { motion = false; document.documentElement.dataset.motion = 'false'; } });
render();
