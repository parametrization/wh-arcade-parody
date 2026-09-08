/** Faceted, articulated 2.5D figures; their origin remains the simulation ground point. */
export function figure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  coat: string,
  skin: string,
  stride: number,
  backpack: boolean,
  cap: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  const face = (points: number[], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = '#13222c55';
  ctx.beginPath();
  ctx.ellipse(2, 5, 17, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [-1, 1]) {
    const dx = side * 5,
      step = side * stride;
    face([dx - 4, -11, dx + 4, -10, dx + 3 + step, 5, dx - 3 + step, 6], '#344758');
    face([dx - 4, -11, dx - 1, -10, dx - 1 + step, 5, dx - 3 + step, 6], '#61788b');
    face(
      [dx - 3 + step, 3, dx + 3 + step, 3, dx + 6 + step, 7, dx + 3 + step, 10, dx - 5 + step, 9],
      '#172733',
    );
    face([dx - 3 + step, 3, dx + 3 + step, 3, dx + 6 + step, 7, dx - 3 + step, 6], '#425363');
  }
  if (backpack) {
    face([-12, -29, -19, -25, -19, -8, -12, -4, -6, -9, -6, -26], '#705a3d');
    face([-18, -24, -12, -27, -12, -7, -18, -10], '#bc9e64');
    face([-18, -24, -12, -27, -7, -24, -13, -21], '#e8cd91');
  }
  face([-8, -30, 7, -30, 12, -24, 9, -8, 3, -5, -10, -9, -12, -24], coat);
  face([-8, -30, -3, -27, -4, -9, -10, -9, -12, -24], '#ffffff30');
  face([7, -30, 12, -24, 9, -8, 3, -5, 3, -26], '#14283855');
  face([-7, -30, 0, -26, -3, -20, -10, -26], '#e6e4cc');
  face([0, -26, 6, -30, 9, -26, 3, -20], '#b6c4c3');
  face([-2, -23, 1, -23, 2, -7, -1, -7], '#263c49');
  for (const side of [-1, 1]) {
    const swing = -side * stride;
    face(
      [side * 10, -27, side * 15, -23, side * 15 + swing, -9, side * 10 + swing, -7, side * 9, -19],
      coat,
    );
    face(
      [side * 13, -24, side * 15, -23, side * 15 + swing, -9, side * 12 + swing, -9],
      '#14283850',
    );
    face(
      [
        side * 10 + swing,
        -10,
        side * 15 + swing,
        -11,
        side * 15 + swing,
        -5,
        side * 11 + swing,
        -4,
      ],
      skin,
    );
  }
  face([-7, -44, 5, -45, 10, -39, 8, -30, 1, -26, -7, -30, -10, -38], skin);
  face([-7, -44, -2, -42, -3, -31, -7, -30, -10, -38], '#ffe2b944');
  face([5, -45, 10, -39, 8, -30, 1, -26, 3, -34], '#6d403c50');
  face([0, -37, 4, -33, 0, -32, -2, -34], '#f2c293');
  face([-10, -39, -9, -46, -1, -49, 7, -47, 11, -41, 5, -41, 1, -44, -5, -41, -7, -35], '#3a302b');
  face([-9, -46, -1, -49, 7, -47, 1, -45], '#685144');
  ctx.fillStyle = '#263139';
  ctx.fillRect(-5, -38, 2, 2);
  ctx.fillRect(4, -38, 2, 2);
  if (cap) {
    face([-10, -44, -7, -50, 6, -49, 10, -44, 4, -41, -7, -41], coat);
    face([-10, -44, 4, -44, 14, -41, 4, -39, -8, -41], '#33434b');
    face([-7, -50, 6, -49, 10, -44, -4, -46], '#ffffff25');
  }
  ctx.restore();
}
