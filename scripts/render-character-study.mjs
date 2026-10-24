// Development-only export; Node.js 24+ can import the authored TypeScript directly.
import { writeFile } from 'node:fs/promises';
import { bunny, squirrel } from '../src/room.ts';
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const label = (x,y,text,size=16) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia,serif" font-size="${size}" fill="#65516e">${text}</text>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" fill="none" stroke-width="2.5">
<rect width="1200" height="900" fill="#e4cdf4"/>
<rect x="32" y="32" width="1136" height="836" rx="28" fill="#fffbf4" stroke="#b89bc8" stroke-width="2"/>
<text x="70" y="78" font-family="sans-serif" font-size="11" letter-spacing="3" fill="#775784">SQUIRREL CONTROL · VISUAL STUDY 02</text>
<text x="70" y="126" font-family="Georgia,serif" font-size="36" fill="#514255">A softer little woodland family.</text>
<text x="70" y="158" font-family="sans-serif" font-size="15" fill="#66526e">Original characters · rounded silhouettes · expressive poses · warm, gentle colors</text>
<path d="M70 188H1130M70 570H1130" stroke="#d9c5e1"/>
<ellipse cx="350" cy="514" rx="195" ry="34" fill="#f2e8f4"/>
<ellipse cx="855" cy="514" rx="195" ry="34" fill="#f2e8f4"/>
${bunny(228,219,1.6,false)}${bunny(733,219,1.6,true)}
${label(349,552,'Miss Bunny · gently keeping order',18)}${label(855,552,'Miss Bunny · a little celebration',18)}
${[0,1,2,3].map((variant,i)=>`${squirrel({id:`study-${variant}`,x:150+i*277,y:627,scale:1.65,variant,clue:''})}${label(210+i*277,831,['The curious one','The cheeky one','The surprised one','The shy one'][i],16)}`).join('')}
</svg>`.split('\n').map(line => line.trimEnd()).join('\n');
await writeFile('docs/evidence/character-study.svg',svg);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  args:['--no-sandbox'],
});
try {
  const page=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1});
  await page.setContent(`<style>body{margin:0}svg{display:block}</style>${svg}`);
  await page.screenshot({path:'docs/evidence/character-study.png'});
  console.log('Character study exported to docs/evidence/character-study.svg and .png');
} finally { await browser.close(); }
