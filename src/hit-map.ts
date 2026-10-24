import type { Placement } from './room';

const colors = ['#e41e29', '#19c43a', '#263be7', '#d121d9'];
const rgb = colors.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
function ink(node: Element, color: string) {
  for (const el of [node, ...node.querySelectorAll('*')]) {
    for (const attr of ['fill', 'stroke']) {
      const value = el.getAttribute(attr);
      if (value && value !== 'none' && value !== 'transparent') el.setAttribute(attr, color);
    }
    el.removeAttribute('filter');
  }
}
async function raster(svg: SVGElement, width: number, height: number) {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  try {
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(image, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  } finally { URL.revokeObjectURL(url); }
}
function indexAt(data: Uint8ClampedArray, offset: number): number {
  if (data[offset + 3] < 200) return -1;
  return rgb.findIndex(c => c.every((value, i) => Math.abs(data[offset + i] - value) < 8));
}
export type Visibility = { id: string; visiblePixels: number; silhouettePixels: number; ratio: number; visiblePoint: { x: number; y: number }; hiddenPoint?: { x: number; y: number } };
export class HitMap {
  private pixels: Uint8ClampedArray;
  constructor(private width: number, private height: number, private targets: Placement[], pixels: Uint8ClampedArray, public visibility: Visibility[]) { this.pixels = pixels; }
  hit(x: number, y: number): string | undefined {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = indexAt(this.pixels, (Math.floor(y) * this.width + Math.floor(x)) * 4);
    return this.targets[i]?.id;
  }
  static async create(source: SVGElement, width: number, height: number, targets: Placement[]): Promise<HitMap> {
    const clone = source.cloneNode(true) as SVGElement;
    clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height));
    for (const el of [...clone.children]) {
      if (!['defs', 'L1', 'L2', 'L3', 'safe-mess'].includes(el.getAttribute('data-layer') || el.tagName)) el.remove();
    }
    const defs = clone.querySelector('defs');
    defs?.remove();
    for (const layer of clone.querySelectorAll('[data-layer]')) {
      ink(layer, '#000000');
      if (layer.getAttribute('data-layer') === 'L1') {
        for (const [i, target] of targets.entries()) {
          const el = layer.querySelector(`[data-squirrel="${target.id}"]`);
          if (el) ink(el, colors[i]);
        }
      }
    }
    const pixels = await raster(clone, width, height);
    const visibility: Visibility[] = [];
    for (const [i, target] of targets.entries()) {
      const el = clone.querySelector(`[data-squirrel="${target.id}"]`);
      if (!el) continue;
      const isolated = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      isolated.setAttribute('viewBox', `0 0 ${width} ${height}`);
      isolated.setAttribute('width', String(width)); isolated.setAttribute('height', String(height));
      isolated.append(el.cloneNode(true));
      const silhouette = await raster(isolated, width, height);
      let total = 0, visible = 0;
      const visiblePoints: { x: number; y: number }[] = [], hiddenPoints: { x: number; y: number }[] = [];
      for (let p = 0; p < pixels.length; p += 4) {
        if (indexAt(silhouette, p) !== i) continue;
        total++;
        const point = { x: (p / 4) % width, y: Math.floor(p / 4 / width) };
        if (indexAt(pixels, p) === i) { visible++; visiblePoints.push(point); }
        else hiddenPoints.push(point);
      }
      // Interior points in a scanline are used by browser QA to exercise visible vs covered hits.
      const interior = (points: { x: number; y: number }[]) => points[Math.floor(points.length * .45)];
      visibility.push({ id: target.id, silhouettePixels: total, visiblePixels: visible, ratio: total ? visible / total : 0, visiblePoint: interior(visiblePoints), hiddenPoint: interior(hiddenPoints) });
    }
    return new HitMap(width, height, targets, pixels, visibility);
  }
}
