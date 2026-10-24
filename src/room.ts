/** Original layered vector illustration. Geometry is shared with the visibility/hit validator. */
export type Point = { x: number; y: number };
export type Placement = { id: string; x: number; y: number; scale: number; variant: number; clue: string };
export type RoomLayout = { width: number; height: number; mobile: boolean; targets: Placement[] };
export const squirrelSilhouette = [
  'M28 88C-8 91-12 56 0 38C9 21 30 27 28 46C27 58 12 57 15 49C6 55 10 73 27 67Z',
  'M23 50C17 58 18 85 28 92C39 101 58 90 60 74C62 61 54 50 50 47Z',
  'M24 29L20 10Q21 5 25 8L35 20L44 20L54 7Q59 4 59 11L57 29Z',
  'M20 40C18 23 27 17 41 18C58 17 65 32 60 45C53 60 28 59 20 40Z',
  'M26 85C18 87 22 97 32 96L48 96C60 96 60 86 50 85Z',
];
const outline = '#75513e';
const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const rect = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const group = (x: number, y: number, s: number, content: string, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})" ${extra}>${content}</g>`;

export function squirrel(p: Placement): string {
  const colors = ['#c58a5a', '#b77f56', '#c9986b', '#a97953'];
  const fur = colors[p.variant % colors.length];
  return group(p.x, p.y, p.scale, `<g stroke="${outline}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    ${path(squirrelSilhouette[0], fur)}
    ${path('M16 38C4 32-2 51 3 62M7 69L13 77', 'none', 'stroke="#e6b98a" stroke-width="3"')}
    ${path(squirrelSilhouette[1], fur)}${path(squirrelSilhouette[4], fur)}${path(squirrelSilhouette[2], fur)}
    ${path('M25 14L29 22M54 13L51 23', 'none', 'stroke="#eab6a0" stroke-width="4"')}
    ${path(squirrelSilhouette[3], fur)}
    ${ellipse(40, 71, 12, 18, '#f0d5af', 'stroke="none"')}
    ${ellipse(39, 44, 15, 10, '#f2d6ad', 'stroke="none"')}
    ${ellipse(28, 41, 4, 2.5, '#db9b8b', 'stroke="none"')}${ellipse(53, 41, 4, 2.5, '#db9b8b', 'stroke="none"')}
    ${ellipse(32, 34, 2.1, 2.7, '#493c32', 'stroke="none"')}${ellipse(49, 34, 2.1, 2.7, '#493c32', 'stroke="none"')}
    ${path('M38 40Q41 37 44 40L41 43Z', '#634434', 'stroke-width="1"')}
    ${path(p.variant === 1 ? 'M41 44Q44 49 47 44' : 'M36 45Q41 50 46 45', 'none', 'stroke-width="1.5"')}
    ${path('M25 63Q28 69 33 67M55 63Q52 69 48 67', 'none')}
    ${path('M31 87L31 91M49 87L49 91', 'none', 'stroke-width="1.3"')}
  </g>`, `data-squirrel="${p.id}"`);
}

export function makeLayout(mobile: boolean): RoomLayout {
  return mobile ? {
    width: 640, height: 820, mobile,
    targets: [
      { id: 'curtain', x: 76, y: 205, scale: .88, variant: 0, clue: 'curtain' },
      { id: 'sofa', x: 335, y: 294, scale: .9, variant: 1, clue: 'sofa' },
      { id: 'cabinet', x: 520, y: 388, scale: .92, variant: 2, clue: 'cabinet' },
      { id: 'basket', x: 53, y: 588, scale: 1, variant: 3, clue: 'basket' },
    ]
  } : {
    width: 1120, height: 650, mobile,
    targets: [
      { id: 'curtain', x: 162, y: 176, scale: .88, variant: 0, clue: 'curtain' },
      { id: 'sofa', x: 555, y: 243, scale: .9, variant: 1, clue: 'sofa' },
      { id: 'cabinet', x: 939, y: 275, scale: .92, variant: 2, clue: 'cabinet' },
      { id: 'basket', x: 135, y: 441, scale: 1, variant: 3, clue: 'basket' },
    ]
  };
}

function plant(x: number, y: number, s = 1) {
  return group(x, y, s, `<g stroke="#64715a" stroke-width="2.2" stroke-linecap="round">
    ${path('M0 0Q-3-60 6-91M0-32Q-26-40-32-65M2-44Q27-54 31-77', 'none')}
    ${path('M5-73Q-18-96-3-114Q20-101 5-73Z', '#a1b18b')}
    ${path('M-13-48Q-47-39-47-69Q-22-80-13-48Z', '#8da57d')}
    ${path('M9-54Q11-86 42-88Q52-59 9-54Z', '#bac799')}
    ${path('M-2-20Q-33-8-38-36Q-14-51-2-20Z', '#b2bf95')}
    ${path('M2-23Q13-48 37-34Q27-7 2-23Z', '#91a67a')}
    ${path('M-25-2H25L19 39Q0 49-19 39Z', '#d8a080', 'stroke="#996e55"')}
    ${rect(-28, -6, 56, 12, 4, '#e7b798', 'stroke="#996e55"')}
    ${path('M-15 9L-11 32M-3 11V35M10 10L8 32', 'none', 'stroke="#e8b99b"')}
  </g>`);
}

function frame(x: number, y: number, s: number, angle = 0) {
  return group(x, y, s, `<g transform="rotate(${angle} 35 44)" stroke="#9f7b5b" stroke-width="2">
    ${rect(0, 0, 70, 88, 3, '#cfa774')}${rect(7, 7, 56, 74, 1, '#fcf2da')}
    ${path('M34 65C9 50 28 35 34 43C44 31 60 49 34 65Z', '#dca195', 'stroke="none"')}
    ${path('M31 39Q18 21 25 21Q34 20 34 36M36 37Q35 17 42 19Q49 22 39 40', '#dca195', 'stroke="none"')}
    ${path('M17 72H53', 'none', 'stroke="#d0bf99"')}
  </g>`);
}

export function bunny(x: number, y: number, s: number, happy: boolean): string {
  return group(x, y, s, `<g stroke="#937947" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
    ${ellipse(70, 146, 57, 11, '#aa906b', 'stroke="none" opacity=".15"')}
    ${path('M43 82Q19 100 29 132Q33 145 47 143L93 143Q113 142 113 120Q112 94 92 81Z', '#f4db8d')}
    ${path('M41 39C20 5 36-22 48-7Q60 14 58 35M77 35C76-5 95-23 102-4Q107 14 92 43', '#f9e5a6')}
    ${path('M43 1Q38 14 48 29M94 1Q86 14 86 28', 'none', 'stroke="#edbf9d" stroke-width="5"')}
    ${path('M21 67C17 37 40 27 65 29C99 28 122 49 111 77Q107 102 67 101Q26 100 21 67Z', '#f9e5a6')}
    ${ellipse(38, 74, 9, 5, '#e7b19a', 'stroke="none"')}${ellipse(95, 74, 9, 5, '#e7b19a', 'stroke="none"')}
    ${happy ? path('M44 63Q49 55 54 63M80 63Q85 55 90 63', 'none', 'stroke="#66523a"') : `${ellipse(49, 63, 2.7, 3.5, '#66523a', 'stroke="none"')}${ellipse(85, 63, 2.7, 3.5, '#66523a', 'stroke="none"')}`}
    ${path(happy ? 'M60 73Q67 87 74 73Z' : 'M64 72Q67 69 70 72M67 74V78M60 78Q64 82 67 78Q70 82 74 78', happy ? '#d19483' : 'none', 'stroke="#66523a" stroke-width="1.8"')}
    ${path('M47 100Q65 113 88 101L86 136H46Z', '#eae8ce', 'stroke="#a6a581" stroke-width="2"')}
    ${path('M50 99L54 111M84 99L80 111M60 118H75V128H60Z', 'none', 'stroke="#b1af8e" stroke-width="1.5"')}
    ${path(happy ? 'M31 112Q9 95 18 87Q27 83 36 98M105 110Q126 93 119 85Q110 82 101 98' : 'M30 105Q19 122 33 127Q43 123 43 112M104 105Q117 121 105 126Q95 122 94 114', '#f9e5a6')}
    ${path('M38 136Q25 147 39 150H51Q58 146 53 140M84 140Q79 150 93 150H104Q116 145 101 136', '#f9e5a6')}
  </g>`);
}

export function renderRoom(layout: RoomLayout, caught: Set<string>, stage: number): string {
  const m = layout.mobile, w = layout.width, h = layout.height, floor = m ? 555 : 433;
  const solid = (x: number, y: number, scale: number, d: string, fill: string, extra = '') => {
    return group(x, y, scale, path(d, fill, extra));
  };
  // Scene geometry remains identical at all disorder levels; only safe background/floor props change.
  const sx = m ? 170 : 326, sy = m ? 340 : 285, ss = m ? .79 : 1;
  const cx = m ? 505 : 910, cy = m ? 445 : 330, cs = m ? .72 : .94;
  const bx = m ? 38 : 118, by = m ? 650 : 507;
  const defs = `<defs>
    <linearGradient id="wall" x2="0" y2="1"><stop stop-color="#f1e6cf"/><stop offset="1" stop-color="#ece0c3"/></linearGradient>
    <linearGradient id="floor" x2="0" y2="1"><stop stop-color="#ddbc92"/><stop offset="1" stop-color="#edcfaa"/></linearGradient>
    <linearGradient id="sofa" x2="0" y2="1"><stop stop-color="#a9bba1"/><stop offset="1" stop-color="#8fa78c"/></linearGradient>
    <linearGradient id="light"><stop stop-color="#fff9d9" stop-opacity=".48"/><stop offset="1" stop-color="#fff9d9" stop-opacity="0"/></linearGradient>
    <pattern id="wallpaper" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M22 19Q13 12 14 21Q15 27 22 26Q30 23 28 18Q24 14 22 19M22 26V32" fill="none" stroke="#acaa84" stroke-width="1" opacity=".22"/></pattern>
    <pattern id="rug-lines" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 3H18M0 7H18M0 12H18" fill="none" stroke="#eee0c4" stroke-width="1.4" opacity=".7"/></pattern>
    <pattern id="basket-lines" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 3H12M3 0V12M9 0V12" stroke="#a97b4e" stroke-width="1" opacity=".65"/></pattern>
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".035"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
  </defs>`;
  const windowX = m ? 59 : 139, windowY = m ? 71 : 48, windowS = m ? .91 : 1;
  const window = group(windowX, windowY, windowS, `<g stroke="#a98763" stroke-width="2.4" stroke-linejoin="round">
    ${path('M0 93A110 93 0 0 1 220 93V215H0Z', '#d6b48a')}
    ${path('M10 93A100 83 0 0 1 210 93V205H10Z', '#d3e0d0')}
    ${path('M11 156Q39 109 73 157Q116 123 142 153Q179 110 210 154V205H11Z', '#aebf9a', 'stroke="none"')}
    ${path('M11 187Q60 157 104 187Q156 158 210 181V205H11Z', '#bfcba6', 'stroke="none"')}
    ${ellipse(160, 70, 22, 22, '#fbefca', 'stroke="none"')}
    ${path('M110 12V207M8 110H211', 'none', 'stroke="#d6b48a" stroke-width="9"')}
    ${path('M110 12V207M8 110H211', 'none', 'stroke="#aa8865" stroke-width="1.5"')}
    ${rect(-9, 211, 239, 13, 4, '#c6a175')}
    ${path('M-6 7Q-28 73-16 163Q-14 197-26 216L15 216Q2 160 28 113Q47 72 37 8Z', '#eee4c9', 'stroke="#b7a58b"')}
    ${path('M186 8Q177 62 199 114Q223 169 208 216L246 216Q232 175 242 128Q254 59 230 7Z', '#eee4c9', 'stroke="#b7a58b"')}
    ${path('M4 14Q-12 82 1 128M18 12Q11 59 16 87M217 14Q234 67 219 121M230 13Q242 77 229 107', 'none', 'stroke="#d3c6ab"')}
    ${path('M-25 6H246', 'none', 'stroke="#9f7c57" stroke-width="5"')}
    ${ellipse(-28, 6, 6, 6, '#b18b61')}${ellipse(250, 6, 6, 6, '#b18b61')}
  </g>`);
  const bg = `<g data-layer="L0" stroke-linecap="round" stroke-linejoin="round">
    ${rect(0, 0, w, h, 0, 'url(#wall)')}${rect(0, 0, w, floor, 0, 'url(#wallpaper)')}
    ${path(`M0 ${floor}H${w}V${h}H0Z`, 'url(#floor)')}
    ${path(`M0 ${floor-12}H${w}V${floor+5}H0Z`, '#d4be96', 'stroke="#bda47c" stroke-width="1.5"')}
    ${Array.from({length: 7}, (_, i) => path(`M0 ${floor+38+i*40}H${w}`, 'none', 'stroke="#bb946e" stroke-width="1" opacity=".35"')).join('')}
    ${Array.from({length: 5}, (_, i) => path(`M${70+i*235} ${floor+5}L${10+i*280} ${h}`, 'none', 'stroke="#bb946e" stroke-width="1" opacity=".25"')).join('')}
    ${window}
    ${path(m ? 'M81 282L299 102L525 555H60Z' : 'M154 263L350 100L775 434H213Z', 'url(#light)', 'opacity=".7"')}
    ${group(m ? 272 : 425, m ? 89 : 71, m ? .85 : 1, `<g stroke="#ad8762" stroke-width="2">${rect(0,0,133,106,5,'#bf9871')}${rect(7,7,119,92,1,'#f9efd8')}${ellipse(66,48,25,23,'#d6b58c','stroke="none"')}${path('M22 84L51 52L76 79L94 60L115 84Z','#a9b294','stroke="none"')}${path('M18 88H118','none','stroke="#d4c0a0"')}</g>`)}
    ${frame(m ? 416 : 623, m ? 132 : 112, m ? .66 : .72, stage > 0 ? -9 : 0)}
    ${group(m ? 482 : 810, m ? 68 : 67, m ? .75 : 1, `<g stroke="#a48662" stroke-width="2.5">${rect(0,0,207,20,4,'#cba77e')}${path('M18 20V34M188 20V34','none')}${group(13,-64,1,`${rect(0,8,16,56,2,'#a5b49c')}${rect(18,0,18,64,2,'#d7ad8f')}${rect(39,11,17,53,2,'#e5cd9e')}${path('M6 18H11M6 23H11M23 12H31M44 23H51','none','stroke="#eee3cb"')}${path('M61 64L58 14L73 11L81 64Z','#b8a6af')}`)}${group(119,-51,1,`${path('M0 17Q-6-5 6-5Q14 1 10 17M19 17Q16-6 25-6Q35 0 29 20','#f3d997')}${ellipse(15,33,25,23,'#f3d997')}${ellipse(6,31,2,2,'#786146')}${ellipse(22,31,2,2,'#786146')}${path('M13 38Q16 41 19 38','none','stroke-width="1.3"')}`)}</g>`)}
    ${ellipse(m ? 329 : 564, m ? 655 : 544, m ? 269 : 345, m ? 105 : 83, '#c7b18a', 'opacity=".25"')}
    ${ellipse(m ? 321 : 553, m ? 643 : 532, m ? 255 : 335, m ? 100 : 79, '#d0b592', 'stroke="#a78b6a" stroke-width="2"')}
    ${ellipse(m ? 321 : 553, m ? 643 : 532, m ? 241 : 320, m ? 88 : 67, '#e8d9ba', 'stroke="#baa382" stroke-width="2"')}
    ${ellipse(m ? 321 : 553, m ? 643 : 532, m ? 239 : 318, m ? 86 : 65, 'url(#rug-lines)')}
    ${ellipse(m ? 321 : 553, m ? 643 : 532, m ? 217 : 292, m ? 69 : 49, 'none', 'stroke="#b99e77" stroke-width="2" stroke-dasharray="3 7"')}
    ${Array.from({length: 5}, (_,i) => path(`M${(m ? 231 : 445)+i*44} ${m ? 634 : 524}l10-6 10 6-10 6Z`, '#c9b58e', 'opacity=".65"')).join('')}
    ${plant(m ? 586 : 1045, m ? 556 : 455, m ? .85 : 1.12)}
    ${plant(m ? 39 : 72, m ? 493 : 399, m ? .8 : 1.1)}
    ${group(m ? 122 : 232, m ? 300 : 272, m ? .8 : 1, `<g stroke="#8f7859" stroke-width="2.5">${ellipse(35,211,36,8,'#b8a27b')}${path('M35 26V208','none','stroke-width="5"')}${path('M0 52L15 0H57L73 52Q37 65 0 52Z','#f6e7b9')}${path('M22 5L17 53M35 5V56M49 5L55 53','none','stroke="#dfcda1"')}${path('M60 56V88','none','stroke-width="1.5"')}${ellipse(60,90,2.5,3.5,'#a38257')}${path('M35 60Q21 67 35 72','none')}</g>`)}
  </g>`;
  const targets = `<g data-layer="L1">${layout.targets.filter(t => !caught.has(t.id)).map(squirrel).join('')}</g>`;
  const furniture = `<g data-layer="L2" stroke="${outline}" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round">
    <!-- A curtain tie creates an authored hide without making the rest transparent. -->
    ${solid(m ? 55 : 139, m ? 261 : 231, 1, 'M0 0Q32-10 61 0L65 43Q34 47 3 42Z', '#ece0c2', 'stroke="#b7a58b"')}
    ${group(m ? 55 : 139, m ? 261 : 231, 1, path('M4 3Q26 10 58 1M16 12L17 36M41 12L43 38', 'none', 'stroke="#d2c1a2"'))}
    <!-- Cabinet: actual opaque surface is the authoritative solid. -->
    ${solid(cx, cy, cs, 'M0 8Q0 0 9 0H130Q139 0 139 8V142H0Z', '#ba8f65')}
    ${group(cx, cy, cs, `${rect(-5,-7,149,18,4,'#cba57a')}${rect(10,23,119,43,3,'#caa078')}${rect(10,77,119,49,3,'#caa078')}${ellipse(69,44,5,4,'#aa8054')}${ellipse(69,100,5,4,'#aa8054')}${path('M15 142L12 156H26L30 142M108 142L113 156H127L124 142','#9c7554')}${path('M16 32Q49 36 119 31M16 85Q77 91 121 84','none','stroke="#d5b28b" stroke-width="1.4"')}`)}
    <!-- Sofa has a single silhouette, with consistent decorative seams inside. -->
    ${solid(sx, sy, ss, 'M0 90V24Q0 0 28 0H370Q398 0 398 24V90Q421 74 423 103V155Q421 171 399 172H-1Q-25 171-25 154V105Q-25 76 0 90Z', 'url(#sofa)')}
    ${group(sx, sy, ss, `${path('M0 90V119Q0 130 14 131H383Q398 128 398 115V90','none','stroke="#7a9376"')}${path('M16 69Q21 53 39 54H185Q197 57 198 73V115H15Z','#b5c4a9','stroke="#8ca181"')}${path('M214 54H358Q381 54 384 72V115H205V73Q205 59 214 54Z','#b5c4a9','stroke="#8ca181"')}${path('M16 118H383M198 70V118','none','stroke="#839b7c"')}${path('M-10 103V149M408 103V148','none','stroke="#bed0b1"')}${path('M11 173L6 186H25L30 173M365 173L371 186H390L387 173','#997451')}${group(28,40,1,`<g transform="rotate(-9 38 35)">${rect(0,0,76,71,13,'#e8c89e','stroke="#ac9269"')}${path('M11 14L62 55M9 38L39 62M35 9L65 34','none','stroke="#cfb187"')}${path('M12 56L59 12','none','stroke="#f3deba"')}${ellipse(38,35,3,3,'#bba075')}</g>`)}${group(291,40,1,`<g transform="rotate(10 35 35)">${rect(0,0,71,70,12,'#d99f8e','stroke="#aa7e6a"')}${path('M11 12Q35 21 59 12M11 58Q35 49 59 58','none','stroke="#e8beab"')}${ellipse(35,35,3,3,'#bd8a77')}</g>`)}${path('M110 25Q111 20 115 25M278 25Q282 20 284 25','none','stroke="#8ba181"')}`)}
    ${solid(bx, by, 1, 'M0 0Q40-15 89 0L80 61Q45 72 10 60Z', '#c39c6a')}
    ${group(bx, by, 1, `${path('M0 0Q40-15 89 0L80 61Q45 72 10 60Z','url(#basket-lines)','stroke="none"')}${path('M-2-1Q43-16 91-1L89 10Q42-2 0 10Z','#d7b582')}${path('M23 21Q41 31 63 21','none','stroke="#e3c495" stroke-width="4"')}`)}
    ${group(m ? 220 : 440, m ? 572 : 478, m ? .9 : 1, `<g stroke="#9c7a57">${path('M14 32L7 104H22L37 36M179 34L192 103H206L199 31','#b58a5f')}${path('M9 29Q-12 20 2 6Q49-19 139-17Q219-11 222 9Q228 29 203 34Q107 57 9 29Z','#d5af7e')}${path('M12 8Q107-15 206 10','none','stroke="#e5c694"')}${path('M10 27Q106 48 210 23','none','stroke="#b89368"')}${group(48,-35,1,`${ellipse(21,31,32,8,'#b18c63','stroke="none" opacity=".3"')}${ellipse(19,27,30,7,'#e5d5b4')}${path('M0 0H36V18Q33 30 18 29Q2 29 0 18Z','#f8edcf')}${path('M36 4Q58-3 51 16Q47 24 36 18','none','stroke="#a38866"')}${ellipse(18,0,18,5,'#b38b67')}${ellipse(18,-1,14,3,'#947252','stroke="none"')}${path('M10-11Q4-18 10-25M24-13Q30-23 24-31','none','stroke="#f5e5c3" stroke-width="3"')}`)}${group(129,-12,1,`${rect(0,0,48,15,3,'#94a48c')}${path('M5 5H42','none','stroke="#e4dbc1"')}${path('M5-3L38-10L44 0L7 7Z','#e4c79b')}`)}</g>`)}
  </g>`;
  const mess = `<g data-layer="safe-mess" stroke="#ac8863" stroke-width="1.7" stroke-linejoin="round" pointer-events="none">
    ${stage > 0 ? `${group(m ? 433 : 725,m ? 700 : 558,.8,`<g transform="rotate(19)">${rect(0,0,81,62,12,'#d6a28e')}${path('M10 12Q40 22 70 12M10 51Q40 41 70 51','none','stroke="#e6beaa"')}${ellipse(40,31,3,3,'#b88670')}</g>`)}${path(m ? 'M147 729L184 719L199 748L160 758Z' : 'M352 575L389 565L404 594L365 604Z','#f6edd7')}${path(m ? 'M160 734L180 729M164 742L185 736' : 'M365 580L385 574M369 588L390 582','none','stroke="#c6b591"')}` : ''}
    ${stage > 1 ? `${group(m ? 334 : 607,m ? 735 : 580,.8,`${path('M0 0L51-8L66 20L16 32Z','#f7ecd1')}${path('M9 7L46 0M16 17L51 9','none','stroke="#c9b693"')}`)}${group(m ? 526 : 1016,m ? 679 : 566,.8,`${ellipse(0,0,19,15,'#cda27e')}${path('M-16-3Q0 7 16-3M-15 3Q0 13 15 3M-4-14Q-12 0-3 14M6-13Q-2 0 7 13','none','stroke="#e2bd96"')}${path('M15 8Q55 37 61 7Q60-10 79 2','none','stroke="#b68e69" stroke-width="2"')}`)}${path(m ? 'M230 780q-8-12-15-3q6 12 15 3M473 746q-8-12-15-3q6 12 15 3' : 'M852 607q-8-12-15-3q6 12 15 3M319 551q-8-12-15-3q6 12 15 3','#a5ad84')}` : ''}
  </g>`;
  const host = `<g data-layer="L3">${bunny(m ? 420 : 777,m ? 585 : 429,m ? 1.05 : 1.02,caught.size === layout.targets.length)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true" class="room-art">${defs}${bg}${targets}${furniture}${mess}${host}<rect width="${w}" height="${h}" fill="transparent" filter="url(#paper)" pointer-events="none"/></svg>`;
}
