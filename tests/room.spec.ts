import { writeFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Visibility } from '../src/hit-map';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = []; errors.set(page, list);
  page.on('pageerror', error => list.push(error.message));
  page.on('console', message => { if (message.type() === 'error') list.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) list.push(`${response.status()} ${response.url()}`); });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });
const ready = (page: Page) => expect(page.locator('#scene')).toHaveAttribute('aria-busy', 'false');
async function open(page: Page, width = 1440, zh = false) {
  await page.setViewportSize({ width, height: width > 620 ? 1080 : 900 });
  await page.goto('/'); await ready(page); await page.evaluate(() => document.fonts.ready);
  if (zh) { await page.locator('[data-action=language]').click(); await ready(page); }
}
async function start(page: Page) { await page.locator('[data-action=begin]').click(); await ready(page); }
async function visibility(page: Page): Promise<Visibility[]> { return JSON.parse(await page.locator('#scene').getAttribute('data-visibility') || '[]'); }
async function screenPoint(page: Page, point: { x: number; y: number }) {
  const box = (await page.locator('#scene').boundingBox())!;
  const dimensions = await page.locator('#scene svg').evaluate(el => ({ width: (el as SVGSVGElement).viewBox.baseVal.width, height: (el as SVGSVGElement).viewBox.baseVal.height }));
  return { x: box.x + (point.x + .5) / dimensions.width * box.width, y: box.y + (point.y + .5) / dimensions.height * box.height };
}
async function hit(page: Page, point: { x: number; y: number }, touch = false) {
  const p = await screenPoint(page, point);
  if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
}

for (const width of [320, 390, 768, 1440]) {
  for (const zh of [false, true]) {
    test(`composed visibility and responsive layout ${width} ${zh ? 'zh-TW' : 'en'}`, async ({ page }) => {
      await open(page, width, zh); await start(page);
      expect(await page.locator('#scene [data-layer]').evaluateAll(els => els.map(el => el.getAttribute('data-layer')))).toEqual(['L0','L1','L2','safe-mess','L3']);
      const report: unknown[] = [];
      for (const stage of [0, 1, 2]) {
        await page.locator(`[data-action=stage-${stage}]`).click(); await ready(page);
        const masks = await visibility(page);
        report.push({width,stage,masks});
        expect(masks).toHaveLength(4);
        for (const mask of masks) { expect(mask.ratio, `${mask.id}: ${mask.ratio}`).toBeGreaterThanOrEqual(.3); expect(mask.ratio).toBeLessThan(.9); }
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
        const scene = (await page.locator('#scene').boundingBox())!;
        expect(scene.width).toBeGreaterThan(280);
        if (stage === 0 || (stage === 2 && [390,1440].includes(width))) {
          await page.screenshot({ path: `docs/evidence/room-${width}-${zh ? 'zh-TW' : 'en'}-${stage ? 'messy' : 'tidy'}.png`, fullPage: true });
        }
      }
      if (!zh) writeFileSync(`docs/evidence/visibility-${width}.json`, JSON.stringify(report, null, 2));
      for (const mask of await visibility(page)) { await hit(page, mask.visiblePoint); await ready(page); }
      await expect(page.locator('.counter strong')).toHaveText('4 / 4');
    });
  }
}

test('a visible catch counts once, furniture blocks taps, and reset is recoverable', async ({ page }) => {
  await open(page); await start(page);
  const initial = await visibility(page);
  await hit(page, initial.find(x => x.id === 'sofa')!.hiddenPoint!);
  await expect(page.locator('.counter strong')).toHaveText('0 / 4');
  const first = initial[0].visiblePoint;
  await hit(page, first); await ready(page);
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
  await hit(page, first);
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
  await page.locator('[data-action=reset]').click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.locator('[data-action=close]').last().click();
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
  for (const mask of initial.slice(1)) { await hit(page, mask.visiblePoint); await ready(page); }
  await expect(page.locator('.counter strong')).toHaveText('4 / 4');
  await expect(page.locator('.bunny-note h3')).toHaveText('A little peace, at last.');
  await expect(page.locator('#scene [data-squirrel]')).toHaveCount(0);
  await page.locator('[data-action=reset]').first().click(); await ready(page);
  await expect(page.locator('.counter strong')).toHaveText('0 / 4');
  await expect(page.locator('#scene [data-squirrel]')).toHaveCount(4);
});

test('touch inspection is offset, does not catch while dragging, and preserves furniture occlusion', async ({ browser }) => {
  const context = await browser.newContext({ viewport: {width:390,height:900}, hasTouch: true, isMobile:true, deviceScaleFactor:2 });
  const page = await context.newPage(); await page.goto('/'); await ready(page); await start(page);
  await page.locator('[data-action=magnify]').tap(); await ready(page);
  const initial = await visibility(page);
  const p = await screenPoint(page, initial[0].visiblePoint);
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x:p.x-35,y:p.y+35}]});
  await client.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:p.x,y:p.y}]});
  await client.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.counter strong')).toHaveText('0 / 4');
  await expect(page.locator('#lens')).toBeVisible();
  const lensBox = (await page.locator('#lens').boundingBox())!;
  expect(p.x < lensBox.x || p.x > lensBox.x + lensBox.width || p.y < lensBox.y || p.y > lensBox.y + lensBox.height).toBe(true);
  await expect(page.locator('#lens-art svg')).toHaveAttribute('viewBox', '0 0 640 820');
  expect(await page.locator('#lens-art svg').innerHTML()).toBe(await page.locator('#scene svg').innerHTML());
  await hit(page, initial.find(x=>x.id==='cabinet')!.hiddenPoint!, true);
  await expect(page.locator('.counter strong')).toHaveText('0 / 4');
  await page.screenshot({path:'docs/evidence/magnifier-390.png',fullPage:true});
  for (const mask of initial) { await hit(page, mask.visiblePoint, true); await ready(page); }
  await expect(page.locator('.counter strong')).toHaveText('4 / 4');
  await context.close();
});

test('desktop lens is optical, unlimited, keyboard accessible, and can be dismissed', async ({page}) => {
  await open(page); await start(page);
  await page.locator('#scene').press('m'); await ready(page);
  const mask = (await visibility(page))[0];
  const p = await screenPoint(page, mask.visiblePoint);
  await page.mouse.move(p.x,p.y);
  await expect(page.locator('#lens')).toBeVisible();
  await page.screenshot({path:'docs/evidence/magnifier-1440.png',fullPage:true});
  expect(await page.locator('#lens-art svg').innerHTML()).toBe(await page.locator('#scene svg').innerHTML());
  await page.locator('#scene').focus();
  const catchPoint = await screenPoint(page, mask.visiblePoint);
  await page.mouse.move(catchPoint.x, catchPoint.y);
  await page.keyboard.press('Enter'); await ready(page);
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
  await page.locator('#scene').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-action=magnify]')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape'); await ready(page);
  await expect(page.locator('#lens')).toBeHidden();
  await expect(page.locator('.timer strong')).toHaveText('01:00');
});

test('live language, guide, settings, focus, and preferences preserve state', async ({page}) => {
  await open(page,390); await start(page);
  await hit(page,(await visibility(page))[0].visiblePoint); await ready(page);
  await page.locator('[data-action=language]').click(); await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
  await page.locator('[data-action=guide]').click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.locator('[data-action=catch-sofa]').click(); await ready(page);
  await expect(page.locator('.counter strong')).toHaveText('2 / 4');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-action=guide]')).toBeFocused();
  await page.locator('[data-action=settings]').click();
  await page.locator('[data-action=motion]').click();
  await expect(page.locator('[data-action=motion]')).toHaveAttribute('aria-checked','false');
  await expect(page.locator('[data-action=motion]')).toBeFocused();
  await page.locator('[data-action=sound]').last().click();
  await expect(page.locator('[data-action=sound]').last()).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('Escape');
  await page.reload(); await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');
  await expect(page.locator('html')).toHaveAttribute('data-motion','false');
  await expect(page.locator('.counter strong')).toHaveText('0 / 4');
});

test('corrupt or unavailable storage does not block play; reduced motion is respected', async ({page}) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.addInitScript(() => { localStorage.setItem('squirrel-preferences', '{invalid'); });
  await open(page); await start(page);
  await expect(page.locator('html')).toHaveAttribute('data-motion','false');
  await hit(page,(await visibility(page))[0].visiblePoint); await ready(page);
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
  await expect(page.locator('.catch-spark')).toHaveCount(0);
});


test('blocked preference storage still allows catches and language switching', async ({page}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage unavailable','SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable','SecurityError'); };
  });
  await open(page); await start(page);
  await hit(page,(await visibility(page))[0].visiblePoint); await ready(page);
  await page.locator('[data-action=language]').click(); await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
});

test('background visibility pauses interactions until deliberately resumed', async ({page}) => {
  await open(page); await start(page);
  const initial=(await visibility(page))[0];
  await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('dialog h2')).toHaveText('Taking a little break');
  await expect(page.locator('.counter strong')).toHaveText('0 / 4');
  await page.locator('dialog [data-action=close]').last().click();
  await hit(page, initial.visiblePoint); await ready(page);
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
});

test('bundled build plays without external network services', async ({page}) => {
  const external: string[]=[];
  await page.route('**/*',route=> {
    if (!route.request().url().startsWith('http://127.0.0.1:4173') && !route.request().url().startsWith('blob:')) {external.push(route.request().url());return route.abort();}
    return route.continue();
  });
  await open(page); await start(page);
  await hit(page,(await visibility(page))[0].visiblePoint);await ready(page);
  await expect(page.locator('.counter strong')).toHaveText('1 / 4');
  expect(external).toEqual([]);
});

test('automated accessibility audit covers the room and dialogs in both languages', async ({page}) => {
  await open(page,390); await start(page);
  for (const zh of [false,true]) {
    if(zh){await page.locator('[data-action=language]').click(); await ready(page);}
    const roomAudit = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(roomAudit.violations).toEqual([]);
    for(const kind of ['how','guide','settings']) {
      await page.locator(`[data-action=${kind}]`).click();
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      expect(audit.violations).toEqual([]);
      await page.keyboard.press('Escape');
    }
  }
});
