import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {transformWithEsbuild} from 'vite';
import {makeLayout} from '../src/placements';
import {renderRoom} from '../src/room';

for(const mobile of [false,true])test(`all 13 authored hides have stable visible masks, no crop or overlaps: ${mobile?'portrait':'desktop'}`,async({page})=>{
 const room=makeLayout(mobile,'catalog-baseline',true);
 const moduleCode=(await transformWithEsbuild(readFileSync('src/hit-map.ts','utf8'),'hit-map.ts',{format:'esm',target:'es2022'})).code;
 const scenes=Array.from({length:5},(_,stage)=>renderRoom(room,new Set(),stage,stage===4?'lost':'running'));
 await page.setContent('<main id="validation"></main>');
 const reports=await page.evaluate(async({moduleCode,room,scenes})=>{
  const url=URL.createObjectURL(new Blob([moduleCode],{type:'text/javascript'}));
  try{
   const {HitMap}=await import(url);let baseline:any;const result=[];
   for(const [stage,source] of scenes.entries()){
    const container=document.querySelector('#validation')!;container.innerHTML=source;
    const mask=await HitMap.create(container.querySelector('svg')!,room.width,room.height,room.targets);
    if(!baseline)baseline=mask;
    result.push({stage,visibility:mask.visibility,overlappingIds:mask.overlappingIds,stable:baseline.sameVisibleTargets(mask)});
   }
   return result;
  }finally{URL.revokeObjectURL(url);}
 },{moduleCode,room,scenes});
 for(const report of reports){
  expect(report.overlappingIds).toEqual([]);expect(report.stable).toBe(true);expect(report.visibility).toHaveLength(13);
  for(const v of report.visibility){expect(v.cropped,`${v.id} cropped`).toBe(false);expect(v.ratio,`${v.id} exposure`).toBeGreaterThanOrEqual(.3);expect(v.visiblePoint).toBeTruthy();}
 }
 writeFileSync(`docs/evidence/catalog-${mobile?'portrait':'desktop'}.json`,JSON.stringify(reports,null,2));
});

for(const viewport of [320,390,768,1440])test(`actual CSS-resolution silhouettes stay exposed through all mess stages at ${viewport}px`,async({page})=>{
 const room=makeLayout(viewport<=620,'catalog-baseline',true),width=Math.min(1118,viewport-(viewport<=360?24:viewport<=620?32:viewport<=800?52:82));
 const factor=width/room.width,height=Math.ceil(room.height*factor);
 const scaledTargets=room.targets.map(p=>({...p,x:p.x*factor,y:p.y*factor,scale:p.scale*factor}));
 const moduleCode=(await transformWithEsbuild(readFileSync('src/hit-map.ts','utf8'),'hit-map.ts',{format:'esm',target:'es2022'})).code;
 const scenes=Array.from({length:5},(_,stage)=>renderRoom(room,new Set(),stage,stage===4?'lost':'running'));
 await page.setContent('<main id="validation"></main>');
 const reports=await page.evaluate(async({moduleCode,width,height,factor,targets,scenes})=>{
  const url=URL.createObjectURL(new Blob([moduleCode],{type:'text/javascript'}));
  try{
   const {HitMap}=await import(url);let baseline:any;const result=[];
   for(const [stage,source] of scenes.entries()){
    const container=document.querySelector('#validation')!;container.innerHTML=source;const svg=container.querySelector('svg')!;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    for(const layer of svg.querySelectorAll(':scope > [data-layer]')){
     if(layer.getAttribute('data-layer')==='L1')for(const target of targets){layer.querySelector(`[data-squirrel="${target.id}"]`)!.setAttribute('transform',`translate(${target.x} ${target.y}) scale(${target.scale})`);}
     else layer.setAttribute('transform',`scale(${factor})`);
    }
    const mask=await HitMap.create(svg,width,height,targets);if(!baseline)baseline=mask;
    result.push({stage,visibility:mask.visibility,overlappingIds:mask.overlappingIds,stable:baseline.sameVisibleTargets(mask)});
   }
   return result;
  }finally{URL.revokeObjectURL(url);}
 },{moduleCode,width,height,factor,targets:scaledTargets,scenes});
 for(const report of reports){expect(report.stable).toBe(true);expect(report.overlappingIds).toEqual([]);for(const v of report.visibility){expect(v.cropped).toBe(false);expect(v.ratio,`${v.id} at ${viewport}`).toBeGreaterThanOrEqual(.3);}}
 writeFileSync(`docs/evidence/catalog-css-${viewport}.json`,JSON.stringify({viewport,sceneWidth:width,reports},null,2));
});
