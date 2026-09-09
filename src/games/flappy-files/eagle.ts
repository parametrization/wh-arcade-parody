let source: HTMLImageElement | undefined, keyed: HTMLCanvasElement | undefined;
/** Navy-key only: warm dark feathers and pale envelope retain their opacity. */
function prepare() {
  if (!source) {
    source = new Image();
    source.src = '/assets/fidelity/eagle.png';
  }
  if (keyed) return keyed;
  if (!source.complete || !source.naturalWidth) return;
  keyed = document.createElement('canvas');
  keyed.width = source.naturalWidth;
  keyed.height = source.naturalHeight;
  const c = keyed.getContext('2d')!;
  c.drawImage(source, 0, 0);
  const data = c.getImageData(0, 0, keyed.width, keyed.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i],
      g = data.data[i + 1],
      b = data.data[i + 2];
    if (b > r * 1.12 && b > g * 0.96 && r < 85) data.data[i + 3] = 0;
  }
  c.putImageData(data, 0, 0);
  return keyed;
}
const anchors = [
  [0.78, 0.6],
  [0.78, 0.6],
  [0.78, 0.6],
  [0.79, 0.58],
  [0.79, 0.49],
  [0.79, 0.57],
  [0.79, 0.61],
  [0.79, 0.67],
];
export function drawFlight(c: CanvasRenderingContext2D, time: number, y: number, reduced: boolean) {
  const image = prepare();
  if (!image) return false;
  const index = reduced ? 2 : Math.floor(time * 12) % 8,
    [ax, ay] = anchors[index],
    w = image.width / 4,
    h = image.height / 2,
    size = 88;
  const x = 166 - ax * size,
    top = y + 19 - ay * size;
  c.save();
  c.imageSmoothingEnabled = true;
  c.drawImage(
    image,
    Math.round((index % 4) * w),
    Math.round(Math.floor(index / 4) * h),
    Math.round(w),
    Math.round(h),
    x,
    top,
    size,
    size,
  );
  c.fillStyle = '#f3e9cb';
  c.fillRect(137, y + 38, 22, 12);
  c.fillStyle = '#302f2b';
  c.font = 'bold 5px system-ui';
  c.fillText('EPSTEIN', 138, y + 43);
  c.fillText('FILES', 142, y + 48);
  c.restore();
  return true;
}
