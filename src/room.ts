/** Original cel-style artwork; every target and foreground prop stays individually composited. */
export type Point = { x: number; y: number };
export type Placement = { id: string; x: number; y: number; scale: number; variant: number; clue: string };
export type RoomLayout = { width: number; height: number; mobile: boolean; targets: Placement[] };

const ink = '#55463f';
const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const rect = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const group = (x: number, y: number, s: number, content: string, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})" ${extra}>${content}</g>`;
const strokes = `stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
const line = (d: string, color = ink, width = 1.8) => path(d, 'none', `stroke="${color}" stroke-width="${width}"`);
const blush = (x: number, y: number, s = 1) => group(x, y, s,
  `${ellipse(0,0,8,5,'#eeaaa7','stroke="none" opacity=".8"')}${line('M-5-2L-7 2M0-2L-2 2M5-2L3 2','#c77e7e',1.1)}`);

// These are the actual painted silhouettes, never rectangular target hitboxes.
export const squirrelSilhouette = [
  'M28 84C1 96-17 75-13 52C-11 33 6 18 19 27C34 36 27 57 14 54C8 52 8 44 13 42C0 46-2 66 13 69L29 65Z',
  'M19 37L17 14Q18 7 23 12L34 24L47 23L58 11Q63 7 63 15L61 39Z',
  'M15 44C14 27 26 21 40 22C57 19 72 33 69 50L72 55L68 59C73 76 63 91 44 92C25 95 12 87 13 72L9 66L14 61Z',
  'M21 85Q11 95 22 97L33 96Q37 93 33 88M50 88Q46 96 57 97L67 96Q76 92 63 85Z',
];

export function squirrel(p: Placement): string {
  const palette = [
    {fur:'#f3d9ad',tail:'#cd9466',patch:'#d8a375'},
    {fur:'#efd3b4',tail:'#b9815d',patch:'#d1a17d'},
    {fur:'#fae9c9',tail:'#d3a36b',patch:'#e0b583'},
    {fur:'#e3bc96',tail:'#af7957',patch:'#c08f6b'},
  ][p.variant % 4];
  const eyes = p.variant === 1
    ? `${line('M25 42Q29 37 33 42',ink,2.1)}${ellipse(54,41,2.1,2.9,ink,'stroke="none"')}`
    : `${ellipse(29,41,2.2,2.9,ink,'stroke="none"')}${ellipse(54,41,2.2,2.9,ink,'stroke="none"')}`;
  return group(p.x,p.y,p.scale,`<g ${strokes} stroke-width="2.5">
    ${path(squirrelSilhouette[0],palette.tail)}
    ${line('M13 34C-3 32-7 57 3 68Q12 77 22 72','#f0c89a',2.6)}
    ${line('M4 41Q-1 51 2 58',ink,1.4)}
    ${path(squirrelSilhouette[1],palette.fur)}
    ${path('M22 17L27 27L21 27M58 17L53 27L60 28',palette.patch,'stroke="none"')}
    ${path(squirrelSilhouette[3],palette.fur)}
    ${path(squirrelSilhouette[2],palette.fur)}
    ${path('M25 28Q28 24 34 25L39 35Q33 35 28 32Z',palette.patch,'stroke="none"')}
    ${path('M48 25Q58 25 63 33L56 37Q51 34 48 25Z',palette.patch,'stroke="none"')}
    ${path('M24 65Q39 55 58 64Q64 81 49 86Q27 91 24 65Z','#fff3d8','stroke="none"')}
    ${eyes}${blush(23,50,.65)}${blush(60,50,.65)}
    ${path('M39 48Q42 45 45 48L42 51Z',ink,'stroke="none"')}
    ${line(p.variant === 2 ? 'M39 55Q43 51 46 55Q46 60 42 60Q38 59 39 55Z' : 'M35 53Q39 58 42 53Q46 58 50 53',ink,1.5)}
    ${line('M20 65Q26 68 28 64M62 65Q57 69 55 65',ink,1.8)}
    ${path('M35 71Q44 66 50 72L48 80Q42 85 37 80Z','#cd9864','stroke-width="1.3"')}
    ${path('M34 72Q42 64 51 72L50 74H35Z','#a7ad7b','stroke-width="1.3"')}
    ${line('M42 68L43 65',ink,1.2)}
    ${line('M23 89L23 92M62 89L62 92',ink,1.2)}
  </g>`,`data-squirrel="${p.id}"`);
}

export function makeLayout(mobile: boolean): RoomLayout {
  return mobile ? {
    width:640,height:820,mobile,
    targets:[
      {id:'curtain',x:77,y:199,scale:.9,variant:0,clue:'curtain'},
      {id:'sofa',x:335,y:285,scale:.94,variant:1,clue:'sofa'},
      {id:'cabinet',x:521,y:381,scale:.94,variant:2,clue:'cabinet'},
      {id:'basket',x:53,y:580,scale:1.03,variant:3,clue:'basket'},
    ],
  } : {
    width:1120,height:650,mobile,
    targets:[
      {id:'curtain',x:163,y:169,scale:.9,variant:0,clue:'curtain'},
      {id:'sofa',x:555,y:233,scale:.94,variant:1,clue:'sofa'},
      {id:'cabinet',x:939,y:266,scale:.94,variant:2,clue:'cabinet'},
      {id:'basket',x:135,y:433,scale:1.03,variant:3,clue:'basket'},
    ],
  };
}

export function bunny(x:number,y:number,s:number,happy:boolean):string {
  // Asymmetric ears, a cloud-shaped silhouette, a linen pinafore, and a petal-shaped nose.
  return group(x,y,s,`<g ${strokes} stroke-width="2.9">
    ${ellipse(76,178,65,10,'#6f6043','stroke="none" opacity=".16"')}
    ${path('M43 57C25 30 23-12 38-17C54-20 57 26 58 48L83 48C87 18 96-18 109-12C124-5 104 38 103 60Z','#fff0b7')}
    ${path('M37-5Q33 16 45 39M107-1Q96 16 95 38','none','stroke="#e8b6a3" stroke-width="6"')}
    ${path('M32 62C13 76 12 103 16 119L10 124L17 130C15 151 23 170 43 175L114 174C136 170 143 151 139 132L146 126L139 120C145 95 132 68 114 61C90 45 53 47 32 62Z','#fff0b7')}
    ${path('M27 132Q25 161 45 166H112Q127 163 130 145Q115 163 79 158Q42 161 27 132Z','#efd997','stroke="none"')}
    ${line('M30 80Q37 63 55 63','#fff9dc',4)}
    ${path('M47 132Q77 145 109 130L108 165Q79 177 46 164Z','#c3d9bc','stroke="#68775b" stroke-width="2"')}
    ${line('M49 131L56 147M106 131L99 146','#68775b',2)}
    ${path('M65 146Q79 151 94 146V158Q79 166 65 157Z','#e9edd1','stroke="#859576" stroke-width="1.5"')}
    ${path('M74 155Q78 148 84 154Q81 161 74 155Z','#b39bc5','stroke="#8b759b" stroke-width="1"')}
    ${blush(37,108,1.1)}${blush(117,108,1.1)}
    ${happy ? `${line('M48 93Q54 84 61 93',ink,2.8)}${line('M93 93Q100 84 107 93',ink,2.8)}` : `${ellipse(54,94,3,4.3,ink,'stroke="none"')}${ellipse(100,94,3,4.3,ink,'stroke="none"')}${ellipse(53,92.5,.9,1,'#fff9e8','stroke="none"')}${ellipse(99,92.5,.9,1,'#fff9e8','stroke="none"')}`}
    ${path('M72 103Q76 97 80 103Q84 99 85 104Q83 109 78 111Q72 108 72 103Z','#c99380','stroke="none"')}
    ${line(happy ? 'M67 114Q78 132 90 113Q78 119 67 114Z' : 'M69 116Q74 122 79 116Q84 122 90 116',ink,1.8)}
    ${path(happy ? 'M24 137Q4 122 5 109Q8 100 16 106L35 125M127 135Q149 120 148 107Q144 99 137 108L120 126' : 'M23 134Q12 145 20 151Q29 158 38 143M129 134Q143 145 134 152Q124 158 117 143','#fff0b7')}
    ${path('M39 165Q23 177 35 182Q43 186 57 180L60 173M103 173L107 181Q126 186 132 179Q136 173 118 165','#fff0b7')}
    ${line('M37 176L42 177M122 176L117 177',ink,1.5)}
    ${happy ? `<g stroke="#b49b62" stroke-width="2">${line('M4 72L-2 66M11 58L9 49M146 68L153 60M145 50L148 40','#a88cbe',2.7)}${path('M-2 82L1 75L5 82L1 86Z','#f1d582','stroke="none"')}${path('M151 88L154 81L158 88L154 93Z','#f1d582','stroke="none"')}</g>` : ''}
  </g>`);
}

function flower(x:number,y:number,s=1,color='#f7e2b0') {
  return group(x,y,s,`<g stroke="#6c805a" stroke-width="1.5">${line('M0 0Q-5-15 1-31','#6c805a',2)}${path('M-1-9Q-18-23-21-10Q-13-2-1-9Z','#9cb57b')}${path('M0-16Q12-30 18-19Q16-9 0-16Z','#9cb57b')}<g stroke="#a88561" stroke-width="1.1">${ellipse(1,-36,7,12,color)}${ellipse(1,-36,7,12,color,'transform="rotate(60 1 -27)"')}${ellipse(1,-36,7,12,color,'transform="rotate(120 1 -27)"')}${ellipse(1,-27,5,5,'#d3a45e')}</g></g>`);
}

function plant(x:number,y:number,s=1) {
  return group(x,y,s,`<g ${strokes} stroke-width="2.2">
    ${line('M0 0Q-5-50 9-98M-1-31Q-23-42-27-63M1-44Q24-49 34-76','#6c7651',2.2)}
    ${path('M8-75Q-13-96 1-115Q25-103 8-75Z','#9db47d')}
    ${path('M-14-44Q-46-38-46-67Q-21-80-14-44Z','#829d65')}
    ${path('M11-50Q10-81 42-88Q51-56 11-50Z','#a7bc80')}
    ${path('M-2-17Q-28-5-36-32Q-14-48-2-17Z','#a7bc80')}
    ${path('M4-19Q12-43 36-32Q26-6 4-19Z','#829d65')}
    ${line('M2-106L7-84M-36-61L-21-51M32-77L20-60','#c2ce9c',1.2)}
    ${path('M-26-2H27L20 38Q0 50-20 38Z','#d79478')}
    ${rect(-29,-6,60,12,4,'#e7b194')}${line('M-13 10L-10 29M-1 11V35M12 10L10 29','#f3ceb0',2)}
    ${path('M-6 22Q0 15 6 22Q3 28-6 22Z','#f6d2b5','stroke="none"')}
  </g>`);
}

function portrait(x:number,y:number,s:number,angle=0) {
  return group(x,y,s,`<g transform="rotate(${angle} 35 44)" ${strokes} stroke-width="2">
    ${rect(0,0,70,88,5,'#b58a64')}${rect(6,6,58,76,2,'#fdf0d3')}
    ${line('M12 77H58','#d2b99a',1)}
    ${path('M34 64Q13 49 28 38Q37 33 43 43Q56 51 34 64Z','#cc9eb3','stroke="none"')}
    ${path('M27 42Q17 16 26 17Q36 19 34 39M36 39Q37 12 45 18Q51 25 43 43','#cc9eb3','stroke="none"')}
    ${ellipse(30,48,1.3,1.5,ink,'stroke="none"')}${ellipse(41,48,1.3,1.5,ink,'stroke="none"')}
    ${line('M34 55Q37 57 40 54',ink,1)}
  </g>`);
}

function windowArt(x:number,y:number,s:number) {
  return group(x,y,s,`<g ${strokes} stroke-width="2.4">
    ${path('M0 93A110 93 0 0 1 220 93V215H0Z','#be9069')}
    ${path('M10 93A100 83 0 0 1 210 93V205H10Z','#b9dfe1')}
    ${ellipse(162,68,23,23,'#fff2bc','stroke="none"')}
    ${path('M22 63Q28 45 38 53Q41 39 52 48Q65 44 69 61Z','#f8f7e8','stroke="none"')}
    ${path('M11 147Q29 113 54 130Q80 94 106 136Q139 102 163 131Q186 109 210 140V205H11Z','#86a774','stroke="none"')}
    ${path('M11 174Q36 155 58 168Q87 141 113 171Q152 145 177 168Q198 152 210 166V205H11Z','#a8be83','stroke="none"')}
    ${line('M31 175L35 145M185 176L183 145','#708b5e',2)}
    ${[35,72,134,177,198].map((fx,i)=>`${ellipse(fx,187-i%2*10,2.6,3,'#f1d99b','stroke="none"')}${ellipse(fx+6,190-i%2*10,2,2,'#e4a9b1','stroke="none"')}`).join('')}
    ${path('M109 10V207M7 110H212','none','stroke="#d5b38b" stroke-width="9"')}
    ${line('M109 11V207M8 109H211','#8a7055',1.5)}
    ${rect(-8,211,237,13,4,'#d4ae83')}
    ${path('M-7 6Q-22 57-16 107Q-5 143-26 215L17 217Q8 155 29 114Q43 70 35 7Z','#e6bcc0','stroke="#8e6e67"')}
    ${path('M185 7Q177 63 198 111Q220 156 209 215H245Q232 175 239 129Q252 59 229 7Z','#e6bcc0','stroke="#8e6e67"')}
    ${path('M-7 6Q-22 57-16 107Q-5 143-26 215L17 217Q8 155 29 114Q43 70 35 7Z','url(#gingham)','stroke="none"')}
    ${path('M185 7Q177 63 198 111Q220 156 209 215H245Q232 175 239 129Q252 59 229 7Z','url(#gingham)','stroke="none"')}
    ${line('M6 15Q-5 59 3 107M22 12Q16 52 18 82M212 13Q230 65 217 109M227 15Q239 70 229 101','#b78d94',1.6)}
    ${path('M-9 8H231V31Q221 43 210 31Q199 43 188 31Q177 43 166 31Q155 43 144 31Q133 43 122 31Q111 43 100 31Q89 43 78 31Q67 43 56 31Q45 43 34 31Q23 43 12 31Q1 43-9 31Z','#f9e9cd','stroke="#9b8065"')}
    ${line('M-24 5H246','#79634f',4)}${ellipse(-27,5,5,5,'#a98160')}${ellipse(249,5,5,5,'#a98160')}
  </g>`);
}

function shelf(x:number,y:number,s:number) {
  return group(x,y,s,`<g ${strokes} stroke-width="2">
    ${path('M15 16V38L35 16M186 16V38L166 16','#c49b75')}
    ${rect(0,0,207,17,4,'#c9a17c')}${line('M4 5H203','#e8c9a0',2)}
    ${group(11,-63,1,`${rect(0,8,17,55,2,'#99b6ab')}${rect(20,0,18,63,2,'#d4a6b6')}${rect(41,10,17,53,2,'#efd6a1')}${path('M62 62L57 17L72 14L80 62Z','#a9b1cf')}${line('M5 18H12M5 24H12M25 11H33M25 15H33M45 23H53M45 49H53','#f8ead5',1.6)}`)}
    ${group(113,-51,1,`${path('M0 51V16L20 0L40 16V51Z','#f5e4bd')}${path('M-4 17L20-3L44 17','#bda1bb')}${rect(14,31,13,20,4,'#c2b19a')}${ellipse(20,19,5,5,'#b0cad0')}${line('M20 15V23M16 19H24','#fff2db',1)}`)}
    ${group(179,-22,.6,`${flower(0,0,.7,'#e9b9c3')}${path('M-15-2H14L10 29Q0 36-11 28Z','#b4c2a0')}`)}
  </g>`);
}

function clock(x:number,y:number,s:number) {
  return group(x,y,s,`<g ${strokes} stroke-width="2">
    ${ellipse(0,0,32,33,'#b48c67')}${ellipse(0,0,26,27,'#fff1d4')}
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>ellipse(Math.sin(i*Math.PI/6)*21,Math.cos(i*Math.PI/6)*21,1,1,'#9e8768','stroke="none"')).join('')}
    ${line('M0-15V0L10 6','#6e6251',2)}${ellipse(0,0,2,2,'#8c775c','stroke="none"')}
  </g>`);
}

function lamp(x:number,y:number,s:number) {
  return group(x,y,s,`<g ${strokes} stroke-width="2.3">
    ${ellipse(35,208,37,9,'#a27e5b')}${ellipse(35,205,31,6,'#d1aa7b')}
    ${line('M35 50V203','#846d52',5)}${line('M33 61V198','#bba075',1.3)}
    ${path('M-4 53L13 0H57L75 53Q67 62 59 55Q50 64 41 57Q32 65 23 57Q10 63-4 53Z','#f7df9f')}
    ${line('M22 6L15 50M35 5V55M48 6L58 51','#d8b879',1.5)}
    ${line('M62 58V86','#8d795b',1.4)}${ellipse(62,88,3,4,'#c19d6c')}
  </g>`);
}

function sofa(x:number,y:number,s:number) {
  return group(x,y,s,`<g ${strokes} stroke-width="2.7">
    ${path('M15 166L10 187H27L35 167M361 167L369 188H387L383 166','#ac7b59')}
    ${path('M-4 91V28Q-4-2 28-2H366Q400-2 400 28V91Q422 77 425 105V150Q426 176 398 177H1Q-28 176-28 150V105Q-28 77-4 91Z','#b7b5d5')}
    ${path('M9 38Q9 10 36 11H360Q385 11 386 39V110H9Z','#cdcae4','stroke="none"')}
    ${path('M7 80Q20 63 46 68H181Q198 71 198 89V125H7Z','#dfdced','stroke="#9b91b0" stroke-width="1.8"')}
    ${path('M217 68H355Q379 67 388 84V125H205V89Q205 74 217 68Z','#dfdced','stroke="#9b91b0" stroke-width="1.8"')}
    ${line('M7 128H389M199 88V126','#9b91b0',1.7)}
    ${path('M-4 91Q9 84 11 103V148Q201 160 386 148V104Q387 86 400 91V155Q393 164 378 163H18Q3 165-4 155Z','#a6a4c6','stroke="none"')}
    ${line('M-14 108V148M412 108V148','#d9d4e6',2)}
    ${group(26,36,1,`<g transform="rotate(-10 40 39)">${rect(0,0,80,77,19,'#f0ceaa','stroke="#a58268" stroke-width="2"')}${line('M10 15Q39 24 69 15M10 63Q40 54 69 63','#d6ab8d',1.4)}${ellipse(40,39,10,10,'#e4b29f','stroke="#b58c76" stroke-width="1.4"')}${path('M36 33Q39 27 43 33Q49 33 45 39Q48 46 41 45Q34 48 35 41Q29 37 36 33Z','#f7e1bc','stroke-width="1"')}</g>`)}
    ${group(289,38,1,`<g transform="rotate(10 36 38)">${rect(0,0,74,74,18,'#a9c8b5','stroke="#778f7b" stroke-width="2"')}${line('M12 13Q37 21 62 13M12 61Q37 54 62 61','#d4e1c9',1.4)}${line('M36 49V29M36 39Q25 23 24 34Q26 42 36 39M36 42Q49 24 49 36Q47 45 36 42','#718e72',1.7)}</g>`)}
    ${group(213,92,1,`${path('M0 0Q21-11 42-1L56 79Q31 92 10 78Z','#dfb3c1','stroke="#a17d92" stroke-width="1.7"')}${path('M5 5L13 72M16 2L25 77M28 0L37 76M39 4L49 75','none','stroke="#edd3da" stroke-width="3"')}${line('M11 79L12 86M20 82L21 90M30 83L31 90M40 81L42 88M49 78L52 84','#a7839b',1.5)}`)}
    ${ellipse(114,29,3,3,'#a7a1bf','stroke="none"')}${ellipse(277,29,3,3,'#a7a1bf','stroke="none"')}
  </g>`);
}

function cabinet(x:number,y:number,s:number) {
  return group(x,y,s,`<g ${strokes} stroke-width="2.5">
    ${path('M9 136L7 157H21L28 137M111 136L118 157H131L129 136','#927351')}
    ${path('M0 5Q0 0 7 0H132Q139 0 139 8V142H0Z','#a2b6a0')}
    ${path('M3 126H136V141H3Z','#829c85','stroke="none"')}
    ${rect(9,21,121,46,4,'#c2cfb2','stroke="#6f836b" stroke-width="1.8"')}
    ${rect(9,78,121,48,4,'#c2cfb2','stroke="#6f836b" stroke-width="1.8"')}
    ${line('M17 29Q72 34 122 29M17 86Q70 90 122 86','#e1e2c3',1.6)}
    ${ellipse(69,44,6,4,'#b39561','stroke="#7e6d51" stroke-width="1.3"')}${ellipse(69,101,6,4,'#b39561','stroke="#7e6d51" stroke-width="1.3"')}
    ${rect(-5,-8,149,19,5,'#d5b387')}${line('M1-2H137','#f0d8ac',1.5)}
  </g>`);
}

function basket(x:number,y:number,s=1) {
  return group(x,y,s,`<g ${strokes} stroke-width="2.3">
    ${path('M0 0Q42-16 90 0L81 59Q47 75 10 60Z','#c99d69')}
    ${path('M1 2Q42-13 89 1L81 58Q44 70 11 59Z','url(#weave)','stroke="none"')}
    ${path('M-2-1Q43-18 92-1L90 11Q44-4 0 11Z','#e0b982')}
    ${line('M26 24Q43 32 64 23','#f5d9a7',3)}
    ${line('M15 16L20 54M74 16L69 55','#ad8157',1.3)}
  </g>`);
}

function teaTable(x:number,y:number,s:number) {
  return group(x,y,s,`<g ${strokes} stroke-width="2.3">
    ${path('M24 30L11 101H26L43 36M183 32L197 102H212L201 29','#ac7f59')}
    ${path('M8 29Q-13 19 3 5Q55-23 140-15Q216-11 225 8Q234 26 209 34Q102 57 8 29Z','#c69b6c')}
    ${path('M9 20Q113 45 216 18V26Q111 53 9 29Z','#b58a62','stroke="none"')}
    ${line('M12 7Q103-12 212 9','#e2be8e',2)}
    ${line('M20 27Q115 42 203 24','#e8c598',1.2)}
    ${group(38,-31,1,`${ellipse(28,31,32,7,'#a4805e','stroke="none" opacity=".25"')}${ellipse(25,27,31,7,'#e6d5b2','stroke-width="1.3"')}${path('M6 2H40V17Q38 30 23 29Q7 29 6 17Z','#f9ecd0','stroke-width="1.7"')}${path('M41 5Q59-2 54 15Q51 23 41 19','none','stroke="#9f8368" stroke-width="2"')}${ellipse(23,2,17,4,'#a97d55','stroke="#8f7053" stroke-width="1.3"')}${line('M14-8Q8-16 15-24M30-8Q36-17 30-25','#ffefd0',2.7)}`)}
    ${group(119,-5,1,`${ellipse(21,7,30,9,'#f0dfbc','stroke-width="1.5"')}${ellipse(11,4,9,5,'#ddb478','stroke="#af865d" stroke-width="1"')}${ellipse(31,7,9,5,'#ddb478','stroke="#af865d" stroke-width="1"')}${ellipse(10,3,1,1,'#9d7350','stroke="none"')}${ellipse(28,5,1,1,'#9d7350','stroke="none"')}`)}
    ${group(159,-40,.8,`${path('M0 24Q-6 1 13-2Q33-5 35 19Q39 36 17 39Q3 40 0 24Z','#d7a9bd','stroke-width="2"')}${path('M33 10L48 4Q46 21 34 24Z','#d7a9bd','stroke-width="2"')}${path('M0 10Q-19 3-17 22Q-14 33 1 26','none','stroke="#8d7082" stroke-width="3"')}${ellipse(16,-2,15,5,'#e5c6d0','stroke-width="1.6"')}${ellipse(17,-7,4,4,'#c5a4bf','stroke-width="1.2"')}${path('M10 16Q16 8 22 16Q19 24 10 16Z','#f9e6d7','stroke="none"')}`)}
  </g>`);
}

function rug(x:number,y:number,rx:number,ry:number) {
  return `<g ${strokes} stroke-width="2">
    ${ellipse(x,y+5,rx+8,ry+4,'#8b785a','stroke="none" opacity=".12"')}
    ${ellipse(x,y,rx,ry,'#a9bdad','stroke="#778f7b"')}
    ${ellipse(x,y,rx-11,ry-9,'#d5dfc5','stroke="#82967b" stroke-width="1.3"')}
    ${ellipse(x,y,rx-25,ry-18,'#e8ead3','stroke="#a3b294" stroke-width="1.5" stroke-dasharray="3 5"')}
    ${Array.from({length:9},(_,i)=>{
      const px=x+(i-4)*(rx-45)/4, py=y+Math.sin(i*1.7)*ry*.25;
      return group(px,py,.65,`${path('M0-7Q-6-17-11-10Q-18-2-7 2Q-17 8-10 13Q-2 17 1 7Q7 17 13 9Q17 1 8-1Q16-9 8-13Q1-17 0-7Z',i%2?'#c6b9d0':'#d5bf99','stroke="none"')}${ellipse(0,0,3,3,'#f4e8c7','stroke="none"')}`);
    }).join('')}
  </g>`;
}

export function renderRoom(layout:RoomLayout,caught:Set<string>,stage:number):string {
  const {mobile:m,width:w,height:h} = layout, floor=m?555:433;
  const defs = `<defs>
    <linearGradient id="wall" x2="0" y2="1"><stop stop-color="#f6e9cd"/><stop offset="1" stop-color="#efddba"/></linearGradient>
    <linearGradient id="floor" x2="0" y2="1"><stop stop-color="#c5a074"/><stop offset="1" stop-color="#e4c599"/></linearGradient>
    <linearGradient id="sunbeam"><stop stop-color="#fff6c6" stop-opacity=".42"/><stop offset="1" stop-color="#fff7da" stop-opacity="0"/></linearGradient>
    <pattern id="wallpaper" width="64" height="62" patternUnits="userSpaceOnUse"><path d="M32 21Q20 10 19 23Q23 33 32 31Q43 25 42 18Q36 12 32 21M32 31V39M27 35L32 38L37 34" stroke="#b7aa7f" stroke-width="1" fill="none" opacity=".28"/></pattern>
    <pattern id="gingham" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 4H18M4 0V18" stroke="#f6e0d5" stroke-width="7" opacity=".44"/></pattern>
    <pattern id="weave" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M0 3H12M0 8H12M3 0V10M9 0V10" stroke="#936e4d" stroke-width=".9" opacity=".62"/></pattern>
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".52" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".032"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
  </defs>`;
  const bg=`<g data-layer="L0" stroke-linecap="round" stroke-linejoin="round">
    ${rect(0,0,w,h,0,'url(#wall)')}${rect(0,0,w,floor,0,'url(#wallpaper)')}
    ${path(`M0 ${floor}H${w}V${h}H0Z`,'url(#floor)')}
    ${rect(0,0,w,17,0,'#bc936c','stroke="#83674e" stroke-width="2"')}
    ${line(`M0 8H${w}`,'#d8b48a',2)}
    ${rect(0,0,18,floor,0,'#c39c75','stroke="#8d7258" stroke-width="2"')}
    ${rect(w-18,0,18,floor,0,'#c39c75','stroke="#8d7258" stroke-width="2"')}
    ${line(`M8 19V${floor}M${w-8} 19V${floor}`,'#daba8e',1.5)}
    ${rect(0,floor-36,w,24,0,'#e1c79f','stroke="#ae8c67" stroke-width="1.3"')}
    ${line(`M0 ${floor-31}H${w}M0 ${floor-17}H${w}`,'#f3dfb7',1.5)}
    ${rect(0,floor-12,w,17,0,'#bd946b','stroke="#8c7053" stroke-width="1.7"')}
    ${Array.from({length:7},(_,i)=>line(`M0 ${floor+30+i*43}Q${w*.45} ${floor+33+i*43} ${w} ${floor+30+i*43}`,'#9f7957',1)).join('')}
    ${Array.from({length:9},(_,i)=>line(`M${(i*173+43)%w} ${floor+5+Math.floor(i/3)*86}l-9 43`,'#aa825a',1)).join('')}
    ${Array.from({length:9},(_,i)=>line(`M${40+i*113} ${floor+55+(i%3)*43}q24-3 40 0m-25 4q14-2 20 0`,'#bc9468',.8)).join('')}
    ${windowArt(m?59:139,m?66:43,m?.91:1)}
    ${path(m?'M82 282L284 111L526 555H70Z':'M156 263L348 101L786 434H212Z','url(#sunbeam)')}
    ${group(m?276:435,m?88:64,m?.81:1,`<g ${strokes} stroke-width="2.3">${rect(0,0,132,119,6,'#b18b69')}${rect(7,7,118,105,2,'#fdf1d4')}${path('M37 91Q28 77 44 66Q27 48 42 37Q56 33 65 52Q71 26 84 32Q100 41 83 61Q100 76 86 89Z','#a7b68d','stroke="#7c926b" stroke-width="1.5"')}${line('M63 91L64 49M64 69L47 52M64 77L80 51','#71845d',1.8)}${path('M44 88H86L78 103H52Z','#ddb699','stroke="#a68164" stroke-width="1.4"')}${ellipse(30,28,4,4,'#d4b8c9','stroke="none"')}${ellipse(99,94,3,3,'#d4b8c9','stroke="none"')}</g>`)}
    ${portrait(m?423:625,m?156:123,m?.65:.76,stage>0?-12:0)}
    ${clock(m?449:741,m?75:72,m?.63:.82)}
    ${shelf(m?485:810,m?65:74,m?.7:1)}
    ${rug(m?321:555,m?650:539,m?255:337,m?102:82)}
    ${plant(m?590:1049,m?558:450,m?.78:1.05)}
    ${plant(m?40:72,m?493:402,m?.78:1.02)}
    ${lamp(m?122:232,m?300:272,m?.8:1)}
    ${group(m?469:832,m?286:250,m?.54:.63,`<g ${strokes} stroke-width="2">${rect(-11,0,88,11,3,'#d2ad80')}${path('M-4 11V44L20 11M69 11V44L44 11','#c29a74')}${flower(31,-15,1.03,'#eec9d7')}${path('M12-10Q30-16 50-9L46 13Q30 21 16 13Z','#b9c6d4')}${line('M21-6L23 10M40-6L38 11','#e0e5e4',1.5)}</g>`)}
  </g>`;
  const targets=`<g data-layer="L1">${layout.targets.filter(p=>!caught.has(p.id)).map(squirrel).join('')}</g>`;
  const furniture=`<g data-layer="L2" ${strokes}>
    ${group(m?55:139,m?261:231,1,`${path('M0 0Q31-14 61-1L65 43Q34 48 3 42Z','#e6bcc0','stroke="#8e6e67" stroke-width="2"')}${path('M0 0Q31-14 61-1L65 43Q34 48 3 42Z','url(#gingham)','stroke="none"')}${line('M6 3Q30 10 57 1M17 14L18 36M42 13L44 38','#b58e96',1.3)}${path('M-2 0Q25-6 60-2L61 5Q26 2-1 7Z','#f3dbb2','stroke="#a98b63" stroke-width="1.2"')}`)}
    ${cabinet(m?505:910,m?445:330,m?.72:.94)}
    ${sofa(m?170:326,m?340:285,m?.79:1)}
    ${basket(m?38:118,m?650:507)}
    ${teaTable(m?216:437,m?577:482,m?.9:1)}
  </g>`;
  const mess=`<g data-layer="safe-mess" ${strokes} stroke-width="1.7" pointer-events="none">
    ${stage>0?`${group(m?433:723,m?710:565,.76,`<g transform="rotate(21)">${rect(0,0,82,65,17,'#e8bdcb')}${line('M10 14Q40 24 71 14M10 54Q41 44 71 54','#f5dce0',1.7)}${path('M35 25Q40 18 46 25Q51 30 45 37Q37 40 35 32Q27 29 35 25Z','#f2d8a8','stroke-width="1.1"')}</g>`)}${path(m?'M149 732L186 722L201 750L162 762Z':'M352 578L389 568L404 597L365 607Z','#fcf0d8','stroke="#a48d70" stroke-width="1.2"')}${line(m?'M162 737L182 732M167 745L187 738':'M365 583L385 577M369 591L390 585','#b3a890',1.2)}`:''}
    ${stage>1?`${group(m?328:605,m?749:590,.8,`${path('M0 0L51-8L66 20L16 32Z','#fbefd6')}${line('M9 7L46 0M16 17L51 9','#c1ac95',1.3)}`)}${group(m?544:1034,m?691:568,.77,`${ellipse(0,0,20,17,'#b9a6cd')}${line('M-17-4Q0 6 17-4M-17 4Q0 14 17 4M-4-16Q-13 0-3 16M7-15Q-3 0 7 16','#dfcfe7',1.5)}${line('M15 10Q47 40 58 9Q59-6 77 0','#977baa',2)}`)}${path(m?'M230 789q-8-12-15-3q6 12 15 3M490 768q-8-12-15-3q6 12 15 3':'M861 606q-8-12-15-3q6 12 15 3M318 551q-8-12-15-3q6 12 15 3','#a5b682','stroke="#7d956b" stroke-width="1.2"')}${group(m?78:70,m?749:544,.65,`${path('M0 0L24-7L39 19L15 27Z','#d4dfbc','stroke-width="1.2"')}${line('M10 6L24 3M14 13L28 10','#91a179',1)}`)}`:''}
  </g>`;
  const host=`<g data-layer="L3">${bunny(m?426:786,m?578:410,m?.94:1.04,caught.size===layout.targets.length)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke-width="2.5" aria-hidden="true" class="room-art">${defs}${bg}${targets}${furniture}${mess}${host}<rect width="${w}" height="${h}" fill="transparent" filter="url(#paper)" pointer-events="none"/></svg>`;
}
