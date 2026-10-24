import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import type {Visibility} from '../src/hit-map';
const localURL='http://127.0.0.1:4175/';
const failures=new WeakMap<Page,string[]>(),network=new WeakMap<Page,string[]>();
function monitor(page:Page){
 const errors:string[]=[],external:string[]=[];failures.set(page,errors);network.set(page,external);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:4175'))external.push(r.url());});
}
test.beforeEach(async({page})=>monitor(page));
test.afterEach(async({page})=>{expect(failures.get(page)).toEqual([]);expect(network.get(page)).toEqual([]);});
const ready=async(page:Page)=>expect(page.locator('#scene')).toHaveAttribute('aria-busy','false');
async function boot(page:Page,width=1440,controlled=false){
 await page.setViewportSize({width,height:width>620?1080:1000});
 if(controlled){await page.clock.install({time:new Date('2026-10-25T04:00:00Z')});await page.clock.pauseAt(new Date('2026-10-25T04:00:01Z'));}
 await page.route('https://**',route=>route.abort());
 await page.goto(localURL+'?seed=playtest-file-01');await ready(page);await page.evaluate(()=>document.fonts.ready);
 await page.locator('[data-action=begin]').click();
}
async function hit(page:Page,p:{x:number;y:number},touch=false){
 await page.evaluate(()=>scrollTo(0,0));
 const box=(await page.locator('#scene').boundingBox())!,size=await page.locator('#scene svg').evaluate(e=>({w:(e as SVGSVGElement).viewBox.baseVal.width,h:(e as SVGSVGElement).viewBox.baseVal.height}));
 const q={x:box.x+(p.x+.5)/size.w*box.width,y:box.y+(p.y+.5)/size.h*box.height};
 if(touch)await page.touchscreen.tap(q.x,q.y);else await page.mouse.click(q.x,q.y);
 return q;
}
async function masks(page:Page):Promise<Visibility[]>{return JSON.parse(await page.locator('#scene').getAttribute('data-visibility')||'[]');}

test('archive CRC, content hashes, standalone file and exact candidate JavaScript all match',()=>{
 const manifest=JSON.parse(readFileSync('playtest/MANIFEST.json','utf8'));
 expect(manifest.gameSourceCommit).toBe('4c1f7886148626b2c9ff3f59d5fa0bdddee4b3de');
 expect(manifest.sourceBuildJavascript.sha256).toBe('55403aec683d0bc3e56d8eb356594039e4f242b10f6baff726e492c0b9121871');
 const html=readFileSync('playtest/Squirrel-Control-Playtest.html','utf8');
 expect(createHash('sha256').update(html).digest('hex')).toBe(manifest.files['Squirrel-Control-Playtest.html']);
 const js=html.match(/<script type="module">([\s\S]*?)<\/script>/)![1].replace(/<\\\/script/gi,'</script');
 expect(createHash('sha256').update(js).digest('hex')).toBe(manifest.sourceBuildJavascript.sha256);
 expect(html).not.toMatch(/(?:src|href)="\.\//);expect(html).not.toMatch(/url\(["']?\.\.?\//);
 expect(html).toContain('bundled-font-licenses');
 execFileSync('python3',['-c',[
  'import pathlib,zipfile,json,hashlib',
  'root=pathlib.Path("playtest")',
  'with zipfile.ZipFile(root/"squirrel-control-room1-4c1f788-playtest.zip") as archive:',
  ' assert archive.testzip() is None',
  ' manifest=json.loads(archive.read("MANIFEST.json"))',
  ' for name,digest in manifest["files"].items():',
  '  assert not pathlib.PurePosixPath(name).is_absolute() and ".." not in pathlib.PurePosixPath(name).parts',
  '  assert hashlib.sha256(archive.read(name)).hexdigest()==digest, name',
  ' assert archive.read("Squirrel-Control-Playtest.html")== (root/"Squirrel-Control-Playtest.html").read_bytes()',
  ' assert archive.read("MANIFEST.json")== (root/"MANIFEST.json").read_bytes()',
 ].join('\n')]);
});

test('downloaded HTML supports real visible/covered hits, optical inspection and a full desktop win without external network',async({page})=>{
 await boot(page);const initial=await masks(page);expect(initial).toHaveLength(10);
 await hit(page,initial.find(v=>v.hiddenPoint)!.hiddenPoint!);await expect(page.locator('.counter strong')).toHaveText('0 / 10');
 await page.locator('[data-action=magnify]').click();
 expect(await page.locator('#lens-art svg').innerHTML()).toBe(await page.locator('#scene svg').innerHTML());
 for(const v of initial)await hit(page,v.visiblePoint);
 await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');await expect(page.locator('#scene [data-layer=L3]')).toHaveAttribute('data-reaction','happy');
});

test('downloaded HTML preserves pause, timeout, disappointed host, language and fresh retry',async({page})=>{
 await boot(page,390,true);await page.clock.fastForward(5000);await page.locator('[data-action=pause]').click();await page.clock.fastForward(100000);
 await expect(page.locator('.timer strong')).toHaveText('00:55');await page.keyboard.press('Escape');
 await page.locator('[data-action=language]').click();await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');
 await page.clock.fastForward(55000);await expect(page.locator('.game-card')).toHaveAttribute('data-phase','lost');await expect(page.locator('#scene [data-layer=L3]')).toHaveAttribute('data-reaction','sad');
 await page.locator('[data-action=reset]').last().click();await ready(page);await expect(page.locator('.timer strong')).toHaveText('01:00');await expect(page.locator('.counter strong')).toHaveText('0 / 10');
});

test('downloaded HTML works in touch emulation, including drag/lift/tap and ten Chinese catches',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:1000},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();monitor(page);await boot(page,390);await page.locator('[data-action=language]').tap();await page.locator('[data-action=magnify]').tap();
 const initial=await masks(page),box=(await page.locator('#scene').boundingBox())!,p=initial[0].visiblePoint;
 const point={x:box.x+p.x/640*box.width,y:box.y+p.y/820*box.height},client=await context.newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x-20,y:point.y+20}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.locator('.counter strong')).toHaveText('0 / 10');await expect(page.locator('#lens')).toBeVisible();
 for(const v of initial)await hit(page,v.visiblePoint,true);
 await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');await expect(page.locator('#result-title')).toHaveText('終於，可以鬆口氣了。');
 expect(failures.get(page)).toEqual([]);expect(network.get(page)).toEqual([]);await context.close();
});

test('the optional Python local-server helper serves the same game, including a real catch',async({page})=>{
 await page.setViewportSize({width:1440,height:1080});const response=await page.goto(localURL+'?seed=playtest-lan-01');expect(response!.status()).toBe(200);await ready(page);await page.evaluate(()=>document.fonts.ready);
 await page.locator('[data-action=begin]').click();await hit(page,(await masks(page))[0].visiblePoint);await expect(page.locator('.counter strong')).toHaveText('1 / 10');
});
