import type { Placement } from './room';
const channel = (n:number) => 64 + n * 80;
const color = (i:number) => `rgb(${channel(i%3)},${channel(Math.floor(i/3)%3)},${channel(Math.floor(i/9)%3)})`;
function ink(node:Element, value:string) {
  for (const el of [node,...node.querySelectorAll('*')]) {
    for (const attr of ['fill','stroke']) {
      const before=el.getAttribute(attr);
      if(before && before!=='none' && before!=='transparent') el.setAttribute(attr,value);
    }
    el.removeAttribute('filter');
  }
}
async function raster(svg:SVGElement,width:number,height:number) {
  const image=new Image(), url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
  try {
    image.src=url; await image.decode();
    const canvas=document.createElement('canvas'); canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
    ctx.drawImage(image,0,0,width,height);return ctx.getImageData(0,0,width,height).data;
  } finally {URL.revokeObjectURL(url);}
}
function indexAt(data:Uint8ClampedArray,offset:number,count:number):number {
  if(data[offset+3]<200)return -1;
  let index=0, factor=1;
  for(let c=0;c<3;c++) {
    const n=Math.round((data[offset+c]-64)/80);
    if(n<0||n>2||Math.abs(data[offset+c]-channel(n))>=8)return -1;
    index+=n*factor; factor*=3;
  }
  return index<count?index:-1;
}
export type Visibility={id:string;visiblePixels:number;silhouettePixels:number;ratio:number;visiblePoint:{x:number;y:number};hiddenPoint?:{x:number;y:number};cropped:boolean};
export class HitMap {
  constructor(private width:number,private height:number,private targets:Placement[],private pixels:Uint8ClampedArray,public visibility:Visibility[],public overlappingIds:string[]=[]){}
  hit(x:number,y:number):string|undefined {
    if(x<0||y<0||x>=this.width||y>=this.height)return;
    const index=indexAt(this.pixels,(Math.floor(y)*this.width+Math.floor(x))*4,this.targets.length);
    return this.targets[index]?.id;
  }
  /** Comparing visible ink, not backdrop/host pixels, proves mess never takes a target pixel away. */
  sameVisibleTargets(other:HitMap):boolean {
    if(this.width!==other.width||this.height!==other.height)return false;
    for(let p=0;p<this.pixels.length;p+=4) {
      if(indexAt(this.pixels,p,this.targets.length)!==indexAt(other.pixels,p,other.targets.length))return false;
    }
    return true;
  }
  static async create(source:SVGElement,width:number,height:number,targets:Placement[]):Promise<HitMap> {
    if(targets.length>27)throw new Error('Hit ink palette supports at most 27 guests');
    const clone=source.cloneNode(true) as SVGElement;
    clone.setAttribute('width',String(width));clone.setAttribute('height',String(height));
    for(const el of [...clone.children])if(!['L1','L2','L3','safe-mess'].includes(el.getAttribute('data-layer')||''))el.remove();
    for(const layer of clone.querySelectorAll('[data-layer]')) {
      ink(layer,'#000000');
      if(layer.getAttribute('data-layer')==='L1')for(const [i,target] of targets.entries()) {
        const el=layer.querySelector(`[data-squirrel="${target.id}"]`);if(el)ink(el,color(i));
      }
    }
    const pixels=await raster(clone,width,height), visibility:Visibility[]=[],occupied=new Uint8Array(width*height),overlaps=new Set<string>();
    for(const [i,target] of targets.entries()) {
      const el=clone.querySelector(`[data-squirrel="${target.id}"]`);if(!el)continue;
      // A generously padded tile contains the entire painted squirrel, including the tail/stroke.
      // Only real ink pixels count; the tile is an optimization, never a hitbox or denominator.
      const x=Math.floor(target.x-22*target.scale),y=Math.floor(target.y-6*target.scale);
      const tw=Math.ceil(104*target.scale)+2,th=Math.ceil(115*target.scale)+2;
      const isolated=document.createElementNS('http://www.w3.org/2000/svg','svg');
      isolated.setAttribute('viewBox',`${x} ${y} ${tw} ${th}`);
      isolated.setAttribute('width',String(tw));isolated.setAttribute('height',String(th));
      isolated.setAttribute('stroke-width','2.5');isolated.append(el.cloneNode(true));
      const body=await raster(isolated,tw,th);
      let total=0,visible=0,cropped=false;
      const visiblePoints:{x:number;y:number}[]=[],hiddenPoints:{x:number;y:number}[]=[];
      for(let p=0;p<body.length;p+=4) {
        if(indexAt(body,p,targets.length)!==i)continue;
        total++;
        const tx=p/4%tw,ty=Math.floor(p/4/tw),gx=x+tx,gy=y+ty;
        if(tx===0||ty===0||tx===tw-1||ty===th-1||gx<0||gy<0||gx>=width||gy>=height)cropped=true;
        const point={x:gx,y:gy};
        if(gx>=0&&gy>=0&&gx<width&&gy<height){const q=gy*width+gx;if(occupied[q]){overlaps.add(target.id);overlaps.add(targets[occupied[q]-1].id);}occupied[q]=i+1;}
        if(gx>=0&&gy>=0&&gx<width&&gy<height&&indexAt(pixels,(gy*width+gx)*4,targets.length)===i){visible++;visiblePoints.push(point);}
        else hiddenPoints.push(point);
      }
      const interior=(points:{x:number;y:number}[])=>points[Math.floor(points.length*.45)];
      visibility.push({id:target.id,visiblePixels:visible,silhouettePixels:total,ratio:total?visible/total:0,visiblePoint:interior(visiblePoints),hiddenPoint:interior(hiddenPoints),cropped});
    }
    return new HitMap(width,height,targets,pixels,visibility,[...overlaps]);
  }
}
