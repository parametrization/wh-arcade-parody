/** Original 16-bit-style food pickup. Coordinates use the existing pickup anchor. */
export function drawBurger(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  const block = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const shape = (points: number[][], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  };
  // Dark silhouette, stepped dome, toasted underside and soft bun highlights.
  shape(
    [
      [-17, -2],
      [-15, -6],
      [-11, -10],
      [-5, -12],
      [6, -12],
      [12, -9],
      [16, -5],
      [18, 0],
      [17, 12],
      [13, 16],
      [-12, 16],
      [-17, 12],
    ],
    '#342322',
  );
  shape(
    [
      [-15, -2],
      [-13, -6],
      [-9, -9],
      [-4, -10],
      [6, -10],
      [11, -7],
      [14, -4],
      [16, -1],
    ],
    '#c77d30',
  );
  shape(
    [
      [-13, -3],
      [-11, -6],
      [-7, -8],
      [5, -9],
      [10, -6],
      [13, -3],
    ],
    '#efb958',
  );
  block(-6, -8, 11, 2, '#ffdc88');
  block(-12, -4, 7, 2, '#fbd17a');
  block(-15, -1, 31, 3, '#efb052');
  block(-13, 1, 28, 2, '#995129');
  // Irregular lettuce frills, tomato skin and glistening cut edge.
  shape(
    [
      [-16, 2],
      [-12, 1],
      [-8, 3],
      [-4, 2],
      [1, 3],
      [7, 1],
      [12, 3],
      [16, 2],
      [17, 5],
      [11, 6],
      [5, 4],
      [0, 6],
      [-6, 4],
      [-12, 6],
      [-17, 4],
    ],
    '#4c813b',
  );
  block(-13, 3, 7, 1, '#a4bd56');
  block(3, 3, 9, 1, '#bdd270');
  block(-14, 5, 28, 3, '#a43b32');
  block(-12, 5, 23, 1, '#f07752');
  // A folded cheese corner drapes over the seared patty.
  block(-15, 8, 30, 4, '#4f3026');
  block(-12, 8, 24, 1, '#946047');
  block(-11, 10, 4, 1, '#b17a4c');
  block(4, 10, 6, 1, '#98613e');
  shape(
    [
      [-15, 7],
      [14, 7],
      [11, 10],
      [4, 9],
      [0, 13],
      [-5, 9],
      [-13, 9],
    ],
    '#e8a92f',
  );
  block(-10, 7, 20, 1, '#ffe078');
  shape(
    [
      [-15, 12],
      [-8, 13],
      [7, 13],
      [15, 11],
      [14, 14],
      [10, 15],
      [-10, 15],
      [-14, 14],
    ],
    '#c58035',
  );
  block(-11, 13, 21, 1, '#f5bc64');
  // Individually shaded sesame seeds follow the bun's curve.
  for (const [sx, sy] of [
    [-8, -6],
    [-2, -7],
    [5, -6],
    [10, -3],
    [-5, -3],
  ]) {
    block(sx, sy + 1, 2, 1, '#b88742');
    block(sx, sy, 2, 1, '#fff1b2');
  }
  ctx.restore();
}
