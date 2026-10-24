import type { Placement, RoomLayout } from './room';
import { TARGET_COUNT } from './game';

type Pose = readonly [number, number, number];
export type Spot = { id: string; desktop: Pose; portrait: Pose; clue: string };
/** The full pool is validated together: every ten-element subset inherits its safe geometry. */
export const HIDING_SPOTS: readonly Spot[] = [
  {id:'curtain', desktop:[163,169,.9], portrait:[77,199,.9], clue:'curtain'},
  {id:'curtain-right', desktop:[331,145,.85], portrait:[243,199,.85], clue:'curtainRight'},
  {id:'sofa-left', desktop:[410,233,.94], portrait:[209,285,.88], clue:'sofaLeft'},
  {id:'sofa', desktop:[555,233,.94], portrait:[335,285,.94], clue:'sofa'},
  {id:'sofa-right', desktop:[663,233,.88], portrait:[417,285,.86], clue:'sofaRight'},
  {id:'cabinet', desktop:[939,266,.94], portrait:[521,381,.94], clue:'cabinet'},
  {id:'basket', desktop:[135,433,1.03], portrait:[53,580,1.03], clue:'basket'},
  {id:'plant', desktop:[47,343,.93], portrait:[20,436,.88], clue:'plant'},
  {id:'knitting', desktop:[264,465,.94], portrait:[133,480,.94], clue:'knitting'},
  {id:'picture', desktop:[470,8,.8], portrait:[303,37,.85], clue:'picture'},
  {id:'portrait', desktop:[622,78,.8], portrait:[423,113,.78], clue:'portrait'},
  {id:'letters', desktop:[758,165,.84], portrait:[354,199,.82], clue:'letters'},
  {id:'arm', desktop:[281,326,.9], portrait:[135,356,.84], clue:'arm'},
];
export function random(seed: string): () => number {
  let state = 2166136261;
  for (const c of seed) state = Math.imul(state ^ c.charCodeAt(0), 16777619);
  return () => {
    state |= 0; state = state + 0x6d2b79f5 | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
export function selectedIds(seed: string): string[] {
  const rng = random(seed), ids = HIDING_SPOTS.map(s => s.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, TARGET_COUNT);
}
export function makeLayout(mobile: boolean, seed: string, all = false): RoomLayout {
  const chosen = new Set(selectedIds(seed)), rng = random(`${seed}-fur`);
  const targets: Placement[] = HIDING_SPOTS.map(spot => {
    const [x,y,scale] = mobile ? spot.portrait : spot.desktop;
    return {id:spot.id,x,y,scale,variant:Math.floor(rng()*4),clue:spot.clue};
  }).filter(p => all || chosen.has(p.id));
  return {width:mobile?640:1120,height:mobile?820:650,mobile,targets};
}
export function freshSeed(previous = ''): string {
  let seed: string;
  do { seed = Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(16).padStart(8,'0')).join(''); } while(seed === previous);
  return seed;
}
export function seedFromURL(search: string): string | undefined {
  const value = new URLSearchParams(search).get('seed');
  return value && /^[A-Za-z0-9_-]{1,48}$/.test(value) ? value : undefined;
}
