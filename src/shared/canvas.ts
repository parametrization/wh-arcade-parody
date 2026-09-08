/** Logical canvas pixels stay fixed; CSS scales and letterboxes without stretching. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width + height))
    throw new RangeError('Canvas dimensions must be positive');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.maxWidth = `min(100%, ${width * 1.5}px)`;
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${width} / ${height}`;
  canvas.style.imageRendering = 'auto';
  canvas.style.marginInline = 'auto';
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return {
    ctx,
    width,
    height,
    toGame(clientX: number, clientY: number) {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: bounds.width ? ((clientX - bounds.left) * width) / bounds.width : 0,
        y: bounds.height ? ((clientY - bounds.top) * height) / bounds.height : 0,
      };
    },
  };
}
