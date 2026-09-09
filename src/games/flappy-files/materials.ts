/** Stable, local-space material grain: never randomizes between animation frames. */
const tiles = new Map<string, HTMLCanvasElement>();
export type Material = 'stone' | 'cloth' | 'leather' | 'feather';
function tile(kind: Material) {
  const cached = tiles.get(kind);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d')!;
  let seed = 619;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 1400; i++) {
    const x = random() * 128,
      y = random() * 128;
    c.strokeStyle = i % 3 ? 'rgba(255,245,218,.19)' : 'rgba(15,20,23,.23)';
    c.lineWidth = kind === 'stone' ? 0.5 + random() : 0.35;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(
      x + (kind === 'cloth' ? 3 : kind === 'feather' ? 1 : random() * 4),
      y + (kind === 'feather' ? 7 : kind === 'cloth' ? 1 : random() * 2),
    );
    c.stroke();
  }
  tiles.set(kind, canvas);
  return canvas;
}
export function grain(
  c: CanvasRenderingContext2D,
  kind: Material,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 0.4,
) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = c.createPattern(tile(kind), 'repeat')!;
  c.fillRect(x, y, w, h);
  c.restore();
}
export function litFill(
  c: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  c.fillStyle = color;
  c.fill();
  c.save();
  c.clip();
  const light = c.createLinearGradient(x + w, y, x, y + h);
  light.addColorStop(0, 'rgba(255,240,203,.25)');
  light.addColorStop(0.38, 'rgba(255,244,220,.07)');
  light.addColorStop(1, 'rgba(0,9,20,.43)');
  c.fillStyle = light;
  c.fillRect(x, y, w, h);
  c.restore();
}
