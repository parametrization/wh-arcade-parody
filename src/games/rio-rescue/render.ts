// Fixed-camera polygonal scenery: every object retains its original 24px cell footprint.
type C = CanvasRenderingContext2D;
function poly(c: C, points: number[][], fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
function box(c: C, x: number, y: number, w: number, h: number, d: number, colors: string[]) {
  poly(
    c,
    [
      [x, y],
      [x + w - d, y],
      [x + w, y + d],
      [x + d, y + d],
    ],
    colors[0],
  );
  poly(
    c,
    [
      [x + d, y + d],
      [x + w, y + d],
      [x + w, y + h],
      [x + d, y + h],
    ],
    colors[1],
  );
  poly(
    c,
    [
      [x, y],
      [x + d, y + d],
      [x + d, y + h],
      [x, y + h - d],
    ],
    colors[2],
  );
}
export function drawPerson(c: C, x: number, y: number, i: number, leader = false, stride = 0) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#263d4255';
  c.beginPath();
  c.ellipse(13, 21, 10, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.translate(0, -Math.abs(stride) * 0.35);
  const skin = ['#f3c798', '#bd895f', '#95633f', '#754a32', '#d9a479'][i % 5];
  const coat = leader ? '#46c9aa' : ['#b977a7', '#d3a455', '#7299c3', '#8ca975'][i % 4];
  box(c, 6, 17 + stride, 6, 7, 2, ['#66798b', '#3b506c', '#273346']);
  box(c, 13, 17 - stride, 6, 7, 2, ['#66798b', '#3b506c', '#273346']);
  poly(
    c,
    [
      [5, 12],
      [10, 9],
      [17, 10],
      [20, 18],
      [16, 21],
      [7, 19],
    ],
    coat,
  );
  poly(
    c,
    [
      [5, 12],
      [9, 13],
      [10, 19],
      [7, 19],
    ],
    '#d4ddbf',
  );
  poly(
    c,
    [
      [16, 11],
      [20, 18],
      [16, 21],
      [14, 16],
    ],
    '#344e61',
  );
  box(c, 3, 13 - stride, 5, 7, 2, [skin, skin, '#7e5844']);
  box(c, 18, 13 + stride, 4, 7, 1, [skin, skin, '#7e5844']);
  box(c, 7, 2, 11, 11, 3, ['#ffe1af', skin, '#825b45']);
  poly(
    c,
    [
      [7, 2],
      [14, 0],
      [18, 3],
      [18, 5],
      [10, 4],
      [7, 6],
    ],
    i % 2 ? '#3c3030' : '#694a36',
  );
  c.fillStyle = '#293040';
  c.fillRect(12, 6, 1, 2);
  c.fillRect(16, 6, 1, 2);
  poly(
    c,
    [
      [14, 7],
      [16, 9],
      [14, 9],
    ],
    '#ae7654',
  );
  if (leader) {
    box(c, 2, 9, 5, 10, 2, ['#f2cf7d', '#bd9653', '#645c42']);
    c.fillStyle = '#dbffe1';
    c.fillRect(10, 14, 6, 2);
  }
  c.restore();
}
export function drawGround(c: C, x: number, y: number, gx: number, gy: number) {
  const palette = ['#b4ae83', '#aca87e', '#b8b28a', '#a7a57d'];
  c.fillStyle = palette[(gx * 13 + gy * 7) % 4];
  c.fillRect(x, y, 24, 24);
  poly(
    c,
    [
      [x, y],
      [x + 24, y],
      [x, y + 24],
    ],
    '#ddd1a317',
  );
  c.strokeStyle = '#6b755839';
  c.lineWidth = 0.6;
  c.strokeRect(x + 0.5, y + 0.5, 23, 23);
  for (let k = 0; k < 3; k++) {
    c.fillStyle = k % 2 ? '#d5ce9d66' : '#65725444';
    c.fillRect(
      x + ((gx * 7 + gy * 3 + k * 7) % 21) + 1,
      y + ((gy * 11 + gx * 3 + k * 5) % 21) + 1,
      2,
      1,
    );
  }
}
export function drawObstacle(c: C, x: number, y: number, edge: boolean, index: number) {
  if (edge) {
    c.fillStyle = '#25465b';
    c.fillRect(x, y, 24, 24);
    poly(
      c,
      [
        [x, y + 3],
        [x + 15, y + 6],
        [x + 24, y + 2],
        [x + 24, y + 12],
        [x + 7, y + 15],
        [x, y + 10],
      ],
      '#467b89',
    );
    poly(
      c,
      [
        [x, y + 17],
        [x + 11, y + 14],
        [x + 24, y + 18],
        [x + 24, y + 24],
        [x, y + 24],
      ],
      '#315d70',
    );
    c.strokeStyle = '#87b3ae';
    c.beginPath();
    c.moveTo(x + 2, y + 7 + (index % 3));
    c.lineTo(x + 11, y + 8 + (index % 3));
    c.stroke();
  } else {
    c.fillStyle = '#273b4655';
    c.fillRect(x + 3, y + 4, 21, 20);
    box(c, x + 1, y + 1, 21, 22, 5, ['#bab69c', '#7c897f', '#566b6b']);
    c.strokeStyle = '#526867';
    c.beginPath();
    c.moveTo(x + 6, y + 14);
    c.lineTo(x + 22, y + 14);
    c.moveTo(x + 14, y + 6);
    c.lineTo(x + 14, y + 14);
    c.stroke();
    poly(
      c,
      [
        [x + 3, y + 2],
        [x + 16, y + 2],
        [x + 20, y + 5],
        [x + 7, y + 5],
      ],
      '#dbd0ac',
    );
  }
}
export function drawDock(c: C, x: number, y: number, open: boolean) {
  c.fillStyle = '#324f4055';
  c.fillRect(x + 2, y + 4, 22, 20);
  box(c, x + 1, y + 5, 22, 19, 4, ['#f0dcaa', '#c1b99a', '#7f947f']);
  c.fillStyle = open ? '#f6e6a4' : '#304e51';
  c.fillRect(x + 11, y + 13, 7, 11);
  poly(
    c,
    [
      [x, y + 7],
      [x + 4, y + 1],
      [x + 20, y + 1],
      [x + 24, y + 8],
    ],
    open ? '#73c7a1' : '#6d9487',
  );
  for (let i = 0; i < 3; i++)
    poly(
      c,
      [
        [x + 5 + i * 6, y + 1],
        [x + 7 + i * 6, y + 1],
        [x + 10 + i * 6, y + 8],
        [x + 7 + i * 6, y + 8],
      ],
      '#e3e2b3',
    );
  c.fillStyle = '#486e71';
  c.fillRect(x + 6, y + 13, 3, 5);
}
export function drawSupply(c: C, x: number, y: number) {
  c.fillStyle = '#253d4255';
  c.fillRect(x + 4, y + 19, 19, 4);
  box(c, x + 3, y + 10, 19, 13, 4, ['#ecd09a', '#b48d59', '#796746']);
  c.fillStyle = '#6d5c43';
  c.fillRect(x + 9, y + 16, 11, 1);
  c.fillRect(x + 10, y + 14, 1, 8);
  box(c, x + 5, y + 3, 5, 12, 2, ['#d9f6e6', '#74b9ba', '#37788a']);
  box(c, x + 13, y + 7, 6, 9, 2, ['#f0b672', '#db8b51', '#966e47']);
}
