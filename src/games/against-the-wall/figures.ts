export function facing(heading: number): 'front' | 'back' | 'left' | 'right' {
  const dx = Math.cos(heading) - Math.sin(heading);
  const dy = (Math.cos(heading) + Math.sin(heading)) / 2;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'back' : 'front';
}
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
  heading = Math.PI / 4,
) {
  ctx.save();
  ctx.translate(x, y);
  const orientation = facing(heading);
  const profile = orientation === 'left' || orientation === 'right';
  const back = orientation === 'back';
  if (orientation === 'left') ctx.scale(-1, 1);
  if (profile) ctx.scale(0.85, 1);
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
  if (!back) {
    face([-7, -30, 0, -26, -3, -20, -10, -26], '#e6e4cc');
    face([0, -26, 6, -30, 9, -26, 3, -20], '#b6c4c3');
    face([-2, -23, 1, -23, 2, -7, -1, -7], '#263c49');
  } else if (backpack) {
    face([-10, -27, 7, -27, 10, -10, -9, -9], '#a38755');
    face([-10, -27, -6, -30, 7, -29, 7, -25], '#dfc286');
    face([-7, -18, 6, -18, 7, -11, -7, -11], '#715d40');
  } else {
    face([-7, -28, 6, -28, 5, -25, -6, -25], '#ffffff20');
  }
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
  if (back) {
    face([-8, -42, 8, -42, 8, -30, 0, -27, -8, -31], skin);
    face([-10, -39, -8, -47, 0, -50, 8, -46, 10, -37, 6, -31, -6, -31], '#3a302b');
    face([-8, -47, 0, -50, 8, -46, 1, -44], '#685144');
    if (cap) {
      face([-11, -41, -8, -49, 7, -49, 11, -41, 7, -38, -8, -38], coat);
      face([-7, -48, 6, -48, 9, -43, -5, -44], '#ffffff25');
      face([-3, -41, 4, -41, 4, -39, -3, -39], '#33434b');
    }
  } else if (profile) {
    face([-8, -44, 4, -45, 8, -40, 8, -36, 13, -33, 8, -31, 5, -27, -5, -30, -9, -37], skin);
    face([-8, -44, -3, -42, -2, -31, -5, -30, -9, -37], '#ffe2b944');
    face([8, -36, 13, -33, 8, -32], '#a86e51');
    face([-10, -38, -9, -47, 0, -49, 7, -45, 8, -41, 1, -42, -3, -38, -4, -32, -8, -34], '#3a302b');
    face([-9, -47, 0, -49, 7, -45, -2, -44], '#685144');
    ctx.fillStyle = '#263139';
    ctx.fillRect(5, -38, 2, 2);
    if (cap) {
      face([-10, -42, -7, -49, 4, -49, 9, -43, 7, -40, -8, -40], coat);
      face([0, -43, 13, -43, 16, -40, 6, -39], '#33434b');
      face([-7, -49, 4, -49, 9, -43, -4, -45], '#ffffff25');
    }
  } else {
    face([-7, -44, 5, -45, 10, -39, 8, -30, 1, -26, -7, -30, -10, -38], skin);
    face([-7, -44, -2, -42, -3, -31, -7, -30, -10, -38], '#ffe2b944');
    face([5, -45, 10, -39, 8, -30, 1, -26, 3, -34], '#6d403c50');
    face([0, -37, 4, -33, 0, -32, -2, -34], '#f2c293');
    face(
      [-10, -39, -9, -46, -1, -49, 7, -47, 11, -41, 5, -41, 1, -44, -5, -41, -7, -35],
      '#3a302b',
    );
    face([-9, -46, -1, -49, 7, -47, 1, -45], '#685144');
    ctx.fillStyle = '#263139';
    ctx.fillRect(-5, -38, 2, 2);
    ctx.fillRect(4, -38, 2, 2);
    if (cap) {
      face([-10, -44, -7, -50, 6, -49, 10, -44, 4, -41, -7, -41], coat);
      face([-10, -44, 4, -44, 14, -41, 4, -39, -8, -41], '#33434b');
      face([-7, -50, 6, -49, 10, -44, -4, -46], '#ffffff25');
    }
  }
  ctx.restore();
}
