import {test,expect} from '@playwright/test';
import {Game,ROUND_MS} from '../src/game';
import {HIDING_SPOTS,makeLayout,selectedIds,seedFromURL} from '../src/placements';
import {loadPreferences} from '../src/preferences';
const ids=Array.from({length:10},(_,i)=>`guest-${i}`);

test('a round needs exactly ten unique targets and starts only deliberately',()=>{
 expect(()=>new Game(ids.slice(0,9))).toThrow();expect(()=>new Game([...ids.slice(0,9),ids[0]])).toThrow();
 const game=new Game(ids);expect(game.phase).toBe('idle');expect(game.remaining(999999)).toBe(60000);
 expect(game.catch(ids[0],100)).toBe(false);expect(game.start(100)).toBe(true);expect(game.start(150)).toBe(false);
 expect(game.catch('unknown',200)).toBe(false);expect(game.catch(ids[0],200)).toBe(true);expect(game.catch(ids[0],200)).toBe(false);expect(game.caught.size).toBe(1);
});
test('active time excludes repeated pauses and pauses suspend capture and mess',()=>{
 const game=new Game(ids);game.start(100);game.pause(17100);
 expect(game.elapsed(999999)).toBe(17000);expect(game.stage(999999)).toBe(1);expect(game.catch(ids[0],999999)).toBe(false);
 expect(game.pause(999999)).toBe(false);game.resume(1000000);expect(game.resume(1000001)).toBe(false);
 game.pause(1009000);expect(game.elapsed(2000000)).toBe(26000);game.resume(2000000);game.sync(2034000);expect(game.phase).toBe('lost');
});
for(const [time,stage] of [[14999,0],[15000,1],[29999,1],[30000,2],[44999,2],[45000,3],[59999,3],[60000,4]])test(`time-driven stage at ${time} ms`,()=>{
 const game=new Game(ids);game.start(0);for(const id of ids.slice(0,4))game.catch(id,time);game.sync(time);expect(game.stage(time)).toBe(stage);expect(game.elapsed(time)).toBe(time);
});
for(const at of [59999,60000,60001])for(const syncFirst of [false,true])test(`deadline is race-safe at ${at} ms, sync first ${syncFirst}`,()=>{
 const game=new Game(ids);game.start(0);for(const id of ids.slice(0,9))game.catch(id,1000);
 if(syncFirst)game.sync(at);
 expect(game.catch(ids[9],at)).toBe(at<60000);expect(game.phase).toBe(at<60000?'won':'lost');
 const elapsed=game.elapsed(at);game.sync(1000000);game.pause(1000000);game.resume(1000000);game.catch(ids[9],1000000);
 expect(game.elapsed(2000000)).toBe(elapsed);expect(game.phase).toBe(at<60000?'won':'lost');
});
test('restart constructs independent state, time, target set and capture history',()=>{
 const old=new Game(ids);old.start(0);old.catch(ids[0],100);old.sync(ROUND_MS);
 const fresh=new Game(ids);fresh.start(200000);expect(fresh.caught.size).toBe(0);expect(fresh.remaining(200000)).toBe(60000);expect(fresh.stage(200000)).toBe(0);expect(old.phase).toBe('lost');
});
test('10,000 reproducible seeds always select ten distinct authored spots and every spot participates',()=>{
 const valid=new Set(HIDING_SPOTS.map(s=>s.id)),seen=new Set<string>(),configs=new Set<string>(),invalid:string[]=[];
 for(let i=0;i<10000;i++){
  const seed=`pool-${i}`,selected=selectedIds(seed);if(new Set(selected).size!==10)invalid.push(seed+' count');
  for(const id of selected){if(!valid.has(id))invalid.push(seed+' unknown');seen.add(id);}
  configs.add([...selected].sort().join(','));
  const desktop=makeLayout(false,seed),portrait=makeLayout(true,seed);
  if(JSON.stringify(desktop.targets.map(t=>[t.id,t.variant]))!==JSON.stringify(portrait.targets.map(t=>[t.id,t.variant])))invalid.push(seed+' responsive mismatch');
 }
 expect(invalid).toEqual([]);expect(seen.size).toBe(HIDING_SPOTS.length);expect(configs.size).toBe(286);
 expect(makeLayout(false,'repro')).toEqual(makeLayout(false,'repro'));
});
test('URL room codes are bounded and reject markup or malformed input',()=>{
 expect(seedFromURL('?seed=review-01')).toBe('review-01');expect(seedFromURL('?seed=%3Cscript%3E')).toBeUndefined();expect(seedFromURL('?seed='+ 'x'.repeat(49))).toBeUndefined();expect(seedFromURL('?seed=')).toBeUndefined();
});
test('preferences validate both shape and types, including blocked storage',()=>{
 for(const saved of ['null','true','[]','{bad','{"language":"bad","sound":"true","motion":5}']){
  expect(loadPreferences({getItem:()=>saved},false)).toEqual({language:'en',motion:true,sound:false,largeText:false});
 }
 expect(loadPreferences({getItem:()=>'{"language":"zh-TW","motion":true,"sound":true,"largeText":true}'},true)).toEqual({language:'zh-TW',motion:false,sound:true,largeText:true});
 expect(loadPreferences({getItem:()=>{throw new Error('Blocked');}},false).language).toBe('en');
});

test('every authored clue and every interface key exists in both languages',async()=>{
 const {copy}=await import('../src/i18n');
 expect(Object.keys(copy.en).sort()).toEqual(Object.keys(copy['zh-TW']).sort());
 for(const spot of HIDING_SPOTS)for(const language of ['en','zh-TW'] as const)expect((copy[language] as Record<string,string>)[spot.clue]).toBeTruthy();
});
