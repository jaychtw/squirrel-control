import {chromium,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir,writeFile,appendFile} from 'node:fs/promises';

if(!process.env.DEPLOY_URL||!process.env.RELEASE_COMMIT)throw new Error('DEPLOY_URL and RELEASE_COMMIT are required');
const base=new URL(process.env.DEPLOY_URL);
if(!base.pathname.endsWith('/'))base.pathname+='/';
const destination='deployment-evidence';
await mkdir(destination,{recursive:true});
const checks=[];
let browser;
const report={url:base.href,expectedReleaseCommit:process.env.RELEASE_COMMIT,startedAt:new Date().toISOString(),checks};
const mark=(name)=>{checks.push({name,status:'passed'});console.log(`PASS ${name}`);};
try{
  // Pages/CDN propagation can lag the deployment API. Require the exact new commit.
  let manifest;
  for(let attempt=0;attempt<45;attempt++){
    const url=new URL('release.json',base);url.searchParams.set('verification',`${process.env.RELEASE_COMMIT}-${attempt}`);
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(10000),cache:'no-store'});
      if(response.ok){const result=await response.json();if(result.releaseCommit===process.env.RELEASE_COMMIT){manifest=result;break;}}
    }catch{/* Retry transient publication errors, without accepting stale builds. */}
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  expect(manifest,'Exact release.json must be publicly available').toBeTruthy();
  expect(manifest.gameSourceCommit).toBe('4c1f7886148626b2c9ff3f59d5fa0bdddee4b3de');
  expect(manifest.javascript.sha256).toBe('55403aec683d0bc3e56d8eb356594039e4f242b10f6baff726e492c0b9121871');
  report.manifest=manifest;mark('Public URL serves the exact release commit');
  const bundle=await fetch(new URL(manifest.javascript.path,base));
  expect(bundle.status).toBe(200);
  expect(createHash('sha256').update(Buffer.from(await bundle.arrayBuffer())).digest('hex')).toBe(manifest.javascript.sha256);
  mark('Published JavaScript matches the human-approved candidate byte for byte');

  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:{width:mobile?390:1440,height:mobile?1000:1080},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
    const page=await context.newPage();
    const errors=[],external=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    page.on('request',request=>{if(new URL(request.url()).origin!==base.origin)external.push(request.url());});
    const url=new URL(base);url.searchParams.set('seed','review-room-01');
    expect((await page.goto(url.href)).status()).toBe(200);
    await expect(page.locator('#scene')).toHaveAttribute('aria-busy','false');
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('#scene [data-squirrel]')).toHaveCount(10);
    if(mobile)await page.locator('[data-action=language]').tap();
    await expect(page.locator('html')).toHaveAttribute('lang',mobile?'zh-TW':'en');
    await page.locator('[data-action=begin]').click();
    await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');
    await page.evaluate(()=>scrollTo(0,0));
    const targets=JSON.parse(await page.locator('#scene').getAttribute('data-visibility'));
    expect(targets).toHaveLength(10);
    expect(targets.every(target=>target.ratio>=.3&&!target.cropped)).toBe(true);
    const point=async p=>{
      await page.evaluate(()=>scrollTo(0,0));
      const box=await page.locator('#scene').boundingBox();
      const size=await page.locator('#scene svg').evaluate(el=>({w:el.viewBox.baseVal.width,h:el.viewBox.baseVal.height}));
      return{x:box.x+(p.x+.5)/size.w*box.width,y:box.y+(p.y+.5)/size.h*box.height};
    };
    const hit=async p=>{const q=await point(p);if(mobile)await page.touchscreen.tap(q.x,q.y);else await page.mouse.click(q.x,q.y);};
    const counter=page.locator('.counter strong');
    await hit(targets.find(target=>target.hiddenPoint).hiddenPoint);
    await expect(counter).toHaveText('0 / 10');
    await page.locator('[data-action=magnify]').click();
    const q=await point(targets[0].visiblePoint);
    if(mobile){
      const session=await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:q.x-25,y:q.y+25}]});
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await expect(counter).toHaveText('0 / 10');
    }else await page.mouse.move(q.x,q.y);
    await expect(page.locator('#lens')).toBeVisible();
    expect(await page.locator('#lens-art svg').innerHTML()).toBe(await page.locator('#scene svg').innerHTML());
    await page.screenshot({path:`${destination}/${mobile?'mobile-zh-TW':'desktop-en'}.png`,fullPage:true});
    await page.locator('[data-action=magnify]').click();
    await hit(targets[0].visiblePoint);await expect(counter).toHaveText('1 / 10');
    await page.locator('[data-action=pause]').click();
    await expect(page.locator('.game-card')).toHaveAttribute('data-phase','paused');
    const paused=await page.locator('.timer strong').textContent();
    await page.waitForTimeout(1200);
    await expect(page.locator('.timer strong')).toHaveText(paused);
    await page.keyboard.press('Escape');
    await expect(page.locator('.game-card')).toHaveAttribute('data-phase','running');
    const before=await page.locator('.timer strong').textContent();
    await expect(page.locator('.timer strong')).not.toHaveText(before,{timeout:2500});
    if(!mobile){
      await page.locator('[data-action=language]').click();
      await expect(page.locator('html')).toHaveAttribute('lang','zh-TW');
      await expect(counter).toHaveText('1 / 10');
      await page.locator('[data-action=language]').click();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
    for(const target of targets.slice(1))await hit(target.visiblePoint);
    await expect(page.locator('.game-card')).toHaveAttribute('data-phase','won');
    await expect(counter).toHaveText('10 / 10');
    await expect(page.locator('#scene [data-layer=L3]')).toHaveAttribute('data-reaction','happy');
    await page.screenshot({path:`${destination}/${mobile?'mobile':'desktop'}-win.png`,fullPage:true});
    expect(errors).toEqual([]);expect(external).toEqual([]);
    mark(`${mobile?'390px touch / Traditional Chinese':'1440px mouse / English'}: ten catches, opaque furniture rejection, optical lens, pause, real countdown, win, assets and no overflow`);
    await context.close();
  }
  report.status='passed';
}catch(error){
  report.status='failed';report.error=String(error.stack||error);throw error;
}finally{
  await browser?.close();
  report.finishedAt=new Date().toISOString();
  await writeFile(`${destination}/verification.json`,JSON.stringify(report,null,2)+'\n');
  const summary=`## Public gameplay verification: ${report.status}\n\nURL: ${base.href}\n\nRelease commit: \`${report.expectedReleaseCommit}\`\n\n${checks.map(check=>`- PASS: ${check.name}`).join('\n')}\n\nDesktop/mobile screenshots and machine-readable results are in the **public-gameplay-evidence** artifact. Touch was browser-emulated; no additional physical-device or human sessions are claimed.\n`;
  await writeFile(`${destination}/SUMMARY.md`,summary);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
}
