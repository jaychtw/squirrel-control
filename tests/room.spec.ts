import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type {Visibility} from '../src/hit-map';
const failures=new WeakMap<Page,string[]>();
function monitor(page:Page){const list:string[]=[];failures.set(page,list);page.on('pageerror',e=>list.push(e.message));page.on('console',e=>{if(e.type()==='error')list.push(e.text());});page.on('response',r=>{if(r.status()>=400)list.push(`${r.status()} ${r.url()}`);});}
test.beforeEach(async({page})=>monitor(page));
test.afterEach(async({page})=>expect(failures.get(page)).toEqual([]));
const ready=(page:Page)=>expect(page.locator('#scene')).toHaveAttribute('aria-busy','false');
async function boot(page:Page,width=1440,zh=false,controlled=true){
 await page.setViewportSize({width,height:width>620?1080:1000});
 if(controlled){await page.clock.install({time:new Date('2026-10-25T04:00:00Z')});await page.clock.pauseAt(new Date('2026-10-25T04:00:01Z'));}
 await page.goto('/?seed=review-room-01');await ready(page);await page.evaluate(()=>document.fonts.ready);
 if(zh)await page.locator('[data-action=language]').click();
 await expect(page.locator('[data-action=begin]')).toBeEnabled();
}
async function start(page:Page){await page.locator('[data-action=begin]').click();await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');}
const masks=async(page:Page):Promise<Visibility[]>=>JSON.parse(await page.locator('#scene').getAttribute('data-visibility')||'[]');
async function screenPoint(page:Page,p:{x:number;y:number}){
 const box=(await page.locator('#scene').boundingBox())!;
 const size=await page.locator('#scene svg').evaluate(el=>({w:(el as SVGSVGElement).viewBox.baseVal.width,h:(el as SVGSVGElement).viewBox.baseVal.height}));
 return{x:box.x+(p.x+.5)/size.w*box.width,y:box.y+(p.y+.5)/size.h*box.height};
}
async function hit(page:Page,p:{x:number;y:number},touch=false){const q=await screenPoint(page,p);if(touch)await page.touchscreen.tap(q.x,q.y);else await page.mouse.click(q.x,q.y);}
const count=(page:Page)=>page.locator('.counter strong');
async function catchAll(page:Page,touch=false){for(const v of await masks(page))await hit(page,v.visiblePoint,touch);await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');}

for(const width of [320,390,768,1440])for(const zh of [false,true])test(`complete responsive hunt ${width} ${zh?'zh-TW':'en'}`,async({page})=>{
 await boot(page,width,zh);
 await page.clock.fastForward(20000);await expect(page.locator('.timer strong')).toHaveText('01:00');
 await expect(page.locator('#scene [data-squirrel]')).toHaveCount(10);await start(page);
 expect(await masks(page)).toHaveLength(10);
 expect(await page.locator('#scene [data-layer]').evaluateAll(els=>els.map(el=>el.getAttribute('data-layer')))).toEqual(['L0','L1','L2','safe-mess','L3']);
 await page.screenshot({path:`docs/evidence/gameplay-${width}-${zh?'zh-TW':'en'}-tidy.png`,fullPage:true});
 for(const stage of [1,2,3]){await page.clock.fastForward(15000);await expect(page.locator('#scene')).toHaveAttribute('data-stage',String(stage));expect((await masks(page)).every(v=>v.ratio>=.3&&!v.cropped)).toBe(true);}
 await expect(page.locator('.timer strong')).toHaveText('00:15');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 if([390,1440].includes(width))await page.screenshot({path:`docs/evidence/gameplay-${width}-${zh?'zh-TW':'en'}-messy.png`,fullPage:true});
 await catchAll(page);await expect(count(page)).toHaveText('10 / 10');await expect(page.locator('#scene [data-squirrel]')).toHaveCount(0);
 await expect(page.locator('#scene [data-layer=L3]')).toHaveAttribute('data-reaction','happy');
 await page.clock.fastForward(60000);await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');await expect(page.locator('.timer strong')).toHaveText('00:15');
 if([390,1440].includes(width))await page.screenshot({path:`docs/evidence/gameplay-${width}-${zh?'zh-TW':'en'}-win.png`,fullPage:true});
});

test('covered furniture cannot catch; duplicate clicks do not count; replay resets state and seed',async({page})=>{
 await boot(page);await start(page);const initial=await masks(page),seed=await page.locator('#scene').getAttribute('data-seed');
 await hit(page,initial.find(v=>v.hiddenPoint)!.hiddenPoint!);await expect(count(page)).toHaveText('0 / 10');
 await hit(page,initial[0].visiblePoint);await expect(count(page)).toHaveText('1 / 10');await hit(page,initial[0].visiblePoint);await expect(count(page)).toHaveText('1 / 10');
 await page.locator('[data-action=reset]').click();await expect(page.locator('.game-card')).toHaveAttribute('data-phase','paused');
 await page.locator('dialog [data-action=close]').last().click();await expect(count(page)).toHaveText('1 / 10');await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');
 await page.locator('[data-action=reset]').click();await page.locator('[data-action=confirm-reset]').click();await ready(page);
 await expect(count(page)).toHaveText('0 / 10');await expect(page.locator('.timer strong')).toHaveText('01:00');await expect(page.locator('#scene')).toHaveAttribute('data-stage','0');
 expect(await page.locator('#scene').getAttribute('data-seed')).not.toBe(seed);expect((await masks(page)).map(v=>v.id).sort()).not.toEqual(initial.map(v=>v.id).sort());
 await catchAll(page);await page.locator('[data-action=reset]').last().click();await ready(page);await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');await expect(count(page)).toHaveText('0 / 10');
});

test('pause, instructions, settings and restart confirmation suspend active time and reject room input',async({page})=>{
 await boot(page);await start(page);await page.clock.fastForward(17000);
 for(const action of ['pause','how','settings','reset']){
  const visible=(await masks(page))[0].visiblePoint;
  await page.locator(`[data-action=${action}]`).click();await expect(page.locator('.game-card')).toHaveAttribute('data-phase','paused');
  await page.clock.fastForward(120000);await expect(page.locator('.timer strong')).toHaveText('00:43');await expect(page.locator('#scene')).toHaveAttribute('data-stage','1');
  await hit(page,visible);await expect(count(page)).toHaveText('0 / 10');
  await page.keyboard.press('Escape');await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');
 }
 await page.clock.fastForward(43000);await expect(page.locator('.game-card')).toHaveAttribute('data-phase','lost');
});

for(const width of [390,1440])test(`loss freezes captures, reveals full mess, and retries cleanly at ${width}`,async({page})=>{
 await boot(page,width,width===390);await start(page);const initial=await masks(page);
 await hit(page,initial[0].visiblePoint);await page.clock.fastForward(60000);
 await expect(page.locator('.game-card')).toHaveAttribute('data-phase','lost');await expect(page.locator('.timer strong')).toHaveText('00:00');await expect(page.locator('#scene')).toHaveAttribute('data-stage','4');
 await expect(page.locator('#scene [data-layer=L3]')).toHaveAttribute('data-reaction','sad');await expect(page.locator('.round-result')).toBeVisible();
 await hit(page,initial[1].visiblePoint);await expect(count(page)).toHaveText('1 / 10');
 await page.screenshot({path:`docs/evidence/gameplay-${width}-${width===390?'zh-TW':'en'}-loss.png`,fullPage:true});
 await page.locator('[data-action=reset]').last().click();await ready(page);await expect(page.locator('.timer strong')).toHaveText('01:00');await expect(count(page)).toHaveText('0 / 10');await expect(page.locator('#scene [data-squirrel]')).toHaveCount(10);
});

test('desktop magnifier is optical, unlimited and keyboard-operable without changing clock speed',async({page})=>{
 await boot(page);await start(page);await page.locator('#scene').press('m');const first=(await masks(page))[0],p=await screenPoint(page,first.visiblePoint);
 await page.mouse.move(p.x,p.y);await expect(page.locator('#lens')).toBeVisible();
 expect(await page.locator('#lens-art svg').innerHTML()).toBe(await page.locator('#scene svg').innerHTML());
 await page.screenshot({path:'docs/evidence/gameplay-magnifier-1440.png',fullPage:true});
 await page.locator('#scene').focus();const q=await screenPoint(page,first.visiblePoint);await page.mouse.move(q.x,q.y);await page.keyboard.press('Enter');await expect(count(page)).toHaveText('1 / 10');
 await page.clock.fastForward(5000);await expect(page.locator('.timer strong')).toHaveText('00:55');
 for(let i=0;i<6;i++)await page.locator('[data-action=magnify]').click();await expect(page.locator('.timer strong')).toHaveText('00:55');
 await page.locator('#scene').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-action=magnify]')).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Escape');await expect(page.locator('#lens')).toBeHidden();
 await page.keyboard.press('p');await expect(page.locator('.game-card')).toHaveAttribute('data-phase','paused');await page.keyboard.press('Escape');await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');
});

test('real touch drag inspects without catching, offset lens keeps occlusion, and ten touch catches win',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:1000},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();monitor(page);await boot(page,390);await start(page);await page.clock.fastForward(23000);
 await page.locator('[data-action=magnify]').tap();const initial=await masks(page),p=await screenPoint(page,initial[0].visiblePoint),client=await context.newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x-25,y:p.y+25}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(count(page)).toHaveText('0 / 10');await expect(page.locator('#lens')).toBeVisible();const box=(await page.locator('#lens').boundingBox())!;
 expect(p.x<box.x||p.x>box.x+box.width||p.y<box.y||p.y>box.y+box.height).toBe(true);
 expect(await page.locator('#lens-art svg').innerHTML()).toBe(await page.locator('#scene svg').innerHTML());
 await hit(page,initial.find(v=>v.hiddenPoint)!.hiddenPoint!,true);await expect(count(page)).toHaveText('0 / 10');await page.screenshot({path:'docs/evidence/gameplay-magnifier-390.png',fullPage:true});
 await catchAll(page,true);await expect(count(page)).toHaveText('10 / 10');expect(failures.get(page)).toEqual([]);await context.close();
});

test('language changes retain state; text guide is a complete timed nonvisual alternative',async({page})=>{
 await boot(page,390);await start(page);await hit(page,(await masks(page))[0].visiblePoint);await page.clock.fastForward(5000);
 await page.locator('[data-action=language]').click();await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');await expect(count(page)).toHaveText('1 / 10');await expect(page.locator('.timer strong')).toHaveText('00:55');
 await page.locator('[data-action=guide]').click();await page.clock.fastForward(7000);await expect(page.locator('.guide-clock')).toContainText('00:48');await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');
 await page.locator('dialog [data-action=pause]').click();await page.clock.fastForward(90000);await expect(page.locator('.timer strong')).toHaveText('00:48');await page.keyboard.press('Escape');await expect(page.locator('dialog h2')).toHaveText('跟著小小線索走。');
 for(let i=0;i<9;i++)await page.locator('dialog [data-action^="catch-"]:not(:disabled)').first().click();
 await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');await expect(page.locator('#result-title')).toHaveText('終於，可以鬆口氣了。');
});

test('backgrounding auto-pauses and never auto-resumes on visibility return',async({page})=>{
 await boot(page);await start(page);await page.clock.fastForward(5000);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.fastForward(90000);await expect(page.locator('.timer strong')).toHaveText('00:55');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('.game-card')).toHaveAttribute('data-phase','paused');
 await page.locator('dialog [data-action=close]').last().click();await page.clock.fastForward(5000);await expect(page.locator('.timer strong')).toHaveText('00:50');
});

test('responsive transition keeps IDs, count, time and cached reachability',async({page})=>{
 await boot(page);await start(page);await hit(page,(await masks(page))[0].visiblePoint);await page.clock.fastForward(11000);const ids=(await masks(page)).map(v=>v.id);
 await page.setViewportSize({width:390,height:1000});await expect(page.locator('#scene svg')).toHaveAttribute('viewBox','0 0 640 820');await expect(count(page)).toHaveText('1 / 10');await expect(page.locator('.timer strong')).toHaveText('00:49');expect((await masks(page)).map(v=>v.id)).toEqual(ids);
 await catchAll(page);await expect(count(page)).toHaveText('10 / 10');
});

test('settings persist, reduced motion is honored, and large text stays usable at 320 and 390',async({page})=>{
 await boot(page,390);await start(page);await page.clock.fastForward(4000);
 await page.locator('[data-action=settings]').click();await page.locator('dialog [data-action=motion]').click();await expect(page.locator('dialog [data-action=motion]')).toBeFocused();await page.locator('dialog [data-action=sound]').click();await page.locator('dialog [data-action=largeText]').click();
 await expect(page.locator('html')).toHaveAttribute('data-text','large');await page.keyboard.press('Escape');await expect(page.locator('[data-action=settings]')).toBeFocused();await expect(page.locator('.timer strong')).toHaveText('00:56');
 for(const width of [320,390]){await page.setViewportSize({width,height:1000});for(const zh of [false,true]){if(zh)await page.locator('[data-action=language]').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);} }
 await page.reload();await ready(page);await expect(page.locator('html')).toHaveAttribute('data-motion','false');await expect(page.locator('html')).toHaveAttribute('data-text','large');await expect(count(page)).toHaveText('0 / 10');
 await page.emulateMedia({reducedMotion:'reduce'});await start(page);await hit(page,(await masks(page))[0].visiblePoint);await expect(page.locator('.catch-spark')).toHaveCount(0);
});

for(const blocked of [false,true])test(`corrupt or blocked storage cannot prevent play: blocked ${blocked}`,async({page})=>{
 await page.addInitScript(block=>{if(block){Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};}else localStorage.setItem('squirrel-preferences','{bad');},blocked);
 await boot(page);await start(page);await hit(page,(await masks(page))[0].visiblePoint);await page.locator('[data-action=language]').click();await expect(count(page)).toHaveText('1 / 10');await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');
});

test('production play needs no external requests',async({page})=>{
 const external:string[]=[];await page.route('**/*',route=>{if(!route.request().url().startsWith('http://127.0.0.1:4173')&&!route.request().url().startsWith('blob:')){external.push(route.request().url());return route.abort();}return route.continue();});
 await boot(page);await start(page);await catchAll(page);expect(external).toEqual([]);
});

test('accessibility scans cover bilingual intro, game, all dialogs, outcomes and large text',async({page})=>{
 test.setTimeout(90000);await boot(page,390);
 const audit=async()=>{
  // axe uses browser timers internally; resume its clock during the audit, then freeze again.
  await page.clock.resume();
  const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+50));
  expect(report.violations).toEqual([]);
 };
 for(const zh of [false,true]){
  if(zh)await page.locator('[data-action=language]').click();await audit();
  for(const kind of ['how','guide','settings']){await page.locator(`[data-action=${kind}]`).click();await audit();await page.keyboard.press('Escape');}
 }
 await start(page);await audit();await page.locator('[data-action=pause]').click();await audit();await page.keyboard.press('Escape');await page.locator('[data-action=reset]').click();await audit();await page.keyboard.press('Escape');
 await page.clock.fastForward(60000);await audit();await page.locator('[data-action=reset]').last().click();await ready(page);await catchAll(page);await audit();
 await page.locator('[data-action=settings]').click();await page.locator('dialog [data-action=largeText]').click();await audit();
});

test('unmocked browser clock counts down to a real 60-second loss',async({page})=>{
 test.setTimeout(90000);await boot(page,1440,false,false);await start(page);const began=Date.now();
 await expect(page.locator('.timer strong')).not.toHaveText('01:00',{timeout:4000});
 await expect(page.locator('.game-card')).toHaveAttribute('data-phase','lost',{timeout:65000});
 const elapsed=Date.now()-began;expect(elapsed).toBeGreaterThanOrEqual(59000);expect(elapsed).toBeLessThan(66000);await expect(page.locator('.timer strong')).toHaveText('00:00');
 console.log(`Unmocked full-round wall time: ${elapsed} ms`);
});

test('a tenth catch with one millisecond left wins and a later frame cannot turn it into a loss',async({page})=>{
 await boot(page);await start(page);const initial=await masks(page);
 for(const v of initial.slice(0,9))await hit(page,v.visiblePoint);
 await page.clock.fastForward(59999);await hit(page,initial[9].visiblePoint);
 await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');await expect(count(page)).toHaveText('10 / 10');
 await page.clock.fastForward(5000);await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');
});
