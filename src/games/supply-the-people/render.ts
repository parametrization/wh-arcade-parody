import type { SupplyModel } from './model';
import type { SupplyConfig } from './config';
function rect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function poly(c: CanvasRenderingContext2D, points: number[], color: string) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    if (i === 0) c.moveTo(points[i], points[i + 1]);
    else c.lineTo(points[i], points[i + 1]);
  }
  c.closePath();
  c.fill();
}
function panel(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  base = '#20364b',
  light = '#7b969b',
  dark = '#091323',
) {
  rect(c, x + 3, y + 4, w, h, '#070d19');
  rect(c, x, y, w, h, dark);
  rect(c, x + 2, y + 2, w - 4, h - 4, base);
  rect(c, x + 2, y + 2, w - 4, 2, light);
  rect(c, x + 2, y + 2, 2, h - 4, light);
  rect(c, x + 2, y + h - 4, w - 4, 2, '#111c2d');
  rect(c, x + w - 4, y + 3, 2, h - 6, '#111c2d');
  for (const px of [x + 6, x + w - 8])
    for (const py of [y + 7, y + h - 9]) {
      rect(c, px, py, 3, 3, dark);
      rect(c, px, py, 2, 1, light);
    }
}
function label(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#e5e9d8',
  size = 11,
  center = false,
) {
  c.font = `bold ${size}px monospace`;
  c.textAlign = center ? 'center' : 'left';
  c.fillStyle = '#060e1c';
  c.fillText(text, x + 1, y + 1);
  c.fillStyle = color;
  c.fillText(text, x, y);
  c.textAlign = 'left';
}
export function portrait(c: CanvasRenderingContext2D, person: number, x: number, y: number) {
  c.save();
  c.translate(x, y);
  panel(c, 0, 0, 100, 76, '#162940', '#8b866c');
  for (let row = 0; row < 8; row++)
    rect(
      c,
      5,
      5 + row * 7,
      90,
      7,
      ['#344760', '#30425c', '#2c3d56', '#283850', '#243249', '#202d42', '#1b283d', '#182237'][row],
    );
  rect(c, 7, 6, 4, 53, '#697a80');
  rect(c, 87, 6, 5, 53, '#101b30');
  rect(c, 9, 8, 2, 47, '#97a09a');
  poly(c, [19, 63, 22, 48, 31, 42, 40, 38, 59, 38, 75, 45, 81, 63], '#080f20');
  poly(c, [22, 62, 25, 48, 39, 41, 59, 41, 72, 47, 77, 63], person === 0 ? '#315b87' : '#3d526a');
  poly(c, [22, 61, 27, 48, 31, 46, 29, 61], '#607b98');
  poly(c, [66, 44, 72, 48, 77, 62, 65, 61], '#203550');
  poly(c, [36, 41, 50, 47, 62, 40, 58, 57, 41, 58], '#cad0cb');
  poly(c, [39, 42, 49, 49, 43, 51, 34, 43], '#f0eee1');
  poly(c, [60, 41, 49, 49, 54, 52, 65, 43], '#f0eee1');
  poly(c, [47, 46, 53, 46, 55, 51, 52, 54, 55, 65, 47, 65, 48, 54, 45, 51], '#882c47');
  rect(c, 49, 48, 3, 14, '#e06b69');
  poly(c, [31, 45, 42, 53, 38, 61, 30, 51], '#213650');
  poly(c, [63, 44, 56, 53, 60, 61, 70, 51], '#223a56');
  const skin =
    person === 0
      ? ['#db9057', '#f3b478', '#b56441', '#ffd19a']
      : person === 1
        ? ['#c69880', '#e8bba0', '#936650', '#f4cfb3']
        : ['#d5b395', '#efcfaf', '#a67b62', '#ffdfbd'];
  poly(c, [31, 15, 37, 8, 59, 8, 67, 16, 67, 31, 61, 40, 48, 44, 37, 39, 31, 31], '#151829');
  poly(c, [33, 16, 38, 10, 57, 10, 65, 17, 64, 31, 59, 38, 48, 41, 38, 36, 33, 29], skin[0]);
  poly(c, [37, 13, 56, 11, 61, 17, 58, 24, 59, 34, 50, 39, 39, 34, 36, 26], skin[1]);
  poly(c, [58, 18, 63, 17, 63, 30, 58, 36, 55, 35, 58, 28], skin[2]);
  rect(c, 30, 22, 5, 9, skin[0]);
  rect(c, 63, 22, 5, 8, skin[0]);
  rect(c, 31, 23, 2, 5, skin[2]);
  rect(c, 65, 23, 2, 4, skin[2]);
  rect(c, 39, 23, 7, 3, '#f1e6cf');
  rect(c, 53, 23, 7, 3, '#f1e6cf');
  rect(c, 42, 23, 3, 3, '#252638');
  rect(c, 54, 23, 3, 3, '#252638');
  rect(c, 42, 23, 1, 1, '#eef5e1');
  rect(c, 54, 23, 1, 1, '#eef5e1');
  poly(c, [49, 22, 48, 30, 53, 31, 54, 28], skin[2]);
  rect(c, 49, 24, 2, 6, skin[3]);
  rect(c, 41, 32, 6, 2, skin[0]);
  rect(c, 55, 31, 4, 2, skin[0]);
  if (person === 0) {
    poly(
      c,
      [30, 15, 29, 8, 36, 8, 38, 4, 62, 5, 68, 9, 64, 15, 55, 15, 46, 12, 38, 16, 35, 22, 31, 20],
      '#b48037',
    );
    poly(c, [30, 9, 36, 8, 39, 5, 61, 6, 65, 9, 56, 12, 45, 10, 37, 13, 32, 17], '#e6c064');
    rect(c, 38, 7, 22, 2, '#ffe497');
    rect(c, 34, 11, 13, 2, '#f6d57b');
    rect(c, 56, 11, 8, 2, '#d19b43');
    poly(c, [38, 20, 45, 19, 47, 22, 38, 22], '#b17d3d');
    poly(c, [52, 20, 59, 19, 62, 22, 53, 22], '#b17d3d');
    rect(c, 45, 35, 10, 2, '#a95b48');
    rect(c, 47, 34, 7, 1, '#f5c195');
    rect(c, 45, 38, 10, 1, skin[2]);
    // Gold monogram stamp, an oversized branding prop.
    rect(c, 76, 30, 10, 8, '#82552e');
    rect(c, 78, 28, 6, 4, '#e7c66a');
    rect(c, 73, 38, 15, 7, '#ebc367');
    rect(c, 74, 39, 13, 2, '#fff0a0');
    rect(c, 74, 43, 13, 2, '#875632');
  } else if (person === 1) {
    poly(
      c,
      [30, 19, 31, 11, 36, 6, 59, 5, 65, 10, 66, 20, 61, 16, 57, 11, 43, 11, 35, 17],
      '#29232c',
    );
    poly(c, [32, 12, 38, 7, 58, 7, 63, 10, 47, 9, 39, 13, 33, 18], '#594137');
    rect(c, 39, 8, 18, 2, '#795946');
    poly(
      c,
      [33, 28, 39, 30, 43, 33, 54, 33, 59, 29, 64, 28, 61, 37, 53, 42, 43, 41, 36, 36],
      '#49322e',
    );
    poly(c, [38, 33, 43, 35, 53, 35, 58, 32, 56, 38, 50, 40, 43, 38], '#74503b');
    rect(c, 43, 33, 11, 2, '#bd8b72');
    rect(c, 45, 34, 8, 1, '#efe0c7');
    rect(c, 38, 19, 9, 2, '#49332b');
    rect(c, 52, 19, 10, 2, '#49332b');
    rect(c, 37, 26, 10, 1, '#725765');
    rect(c, 52, 26, 10, 1, '#725765');
    rect(c, 76, 36, 3, 24, '#e4bf65');
    rect(c, 73, 33, 9, 4, '#ffe3a0');
    rect(c, 74, 57, 8, 3, '#a9884d');
    poly(c, [70, 40, 74, 39, 77, 43, 85, 44, 85, 47, 77, 47, 73, 43, 70, 44], '#c3586d');
  } else {
    poly(
      c,
      [31, 20, 30, 12, 36, 6, 60, 6, 66, 13, 65, 22, 61, 18, 60, 12, 42, 11, 35, 17, 35, 24],
      '#352a2a',
    );
    poly(c, [33, 13, 39, 8, 58, 8, 62, 11, 46, 10, 38, 14, 34, 20], '#69533b');
    rect(c, 40, 9, 15, 2, '#a48660');
    rect(c, 36, 20, 13, 9, '#292d38');
    rect(c, 51, 20, 13, 9, '#292d38');
    rect(c, 38, 22, 9, 5, skin[1]);
    rect(c, 53, 22, 9, 5, skin[1]);
    rect(c, 41, 23, 3, 3, '#1d2e37');
    rect(c, 54, 23, 3, 3, '#1d2e37');
    rect(c, 48, 22, 4, 2, '#292d38');
    rect(c, 38, 21, 8, 1, '#9babae');
    rect(c, 53, 21, 8, 1, '#9babae');
    rect(c, 43, 34, 13, 2, '#8c6252');
    rect(c, 45, 34, 9, 1, '#eee1c9');
    rect(c, 73, 30, 16, 22, '#26364c');
    rect(c, 74, 31, 14, 19, '#dfd3ad');
    rect(c, 78, 29, 6, 4, '#9e8157');
    for (let row = 0; row < 3; row++) rect(c, 77, 36 + row * 4, 8, 1, '#776f63');
  }
  rect(c, 3, 62, 94, 12, '#111f32');
  rect(c, 5, 63, 90, 1, '#907c4c');
  label(c, ['DONALD TRUMP', 'JD VANCE', 'MIKE JOHNSON'][person], 50, 72, '#f7d58c', 9, true);
  c.restore();
}
function destinationIcon(c: CanvasRenderingContext2D, d: number, x: number, y: number) {
  if (d === 0) {
    poly(c, [x, y - 9, x + 10, y + 8, x - 10, y + 8], '#122b35');
    poly(c, [x, y - 5, x + 6, y + 5, x - 6, y + 5], '#eff2ca');
  }
  if (d === 1) {
    rect(c, x - 4, y - 10, 8, 21, '#102c38');
    rect(c, x - 10, y - 4, 20, 8, '#102c38');
    rect(c, x - 2, y - 8, 4, 17, '#f7dfdc');
    rect(c, x - 8, y - 2, 16, 4, '#f7dfdc');
  }
  if (d === 2) {
    poly(
      c,
      [
        x - 5,
        y - 10,
        x + 5,
        y - 10,
        x + 10,
        y - 5,
        x + 10,
        y + 5,
        x + 5,
        y + 10,
        x - 5,
        y + 10,
        x - 10,
        y + 5,
        x - 10,
        y - 5,
      ],
      '#123444',
    );
    poly(
      c,
      [
        x - 4,
        y - 6,
        x + 4,
        y - 6,
        x + 6,
        y - 3,
        x + 6,
        y + 3,
        x + 3,
        y + 6,
        x - 3,
        y + 6,
        x - 6,
        y + 3,
        x - 6,
        y - 3,
      ],
      '#e6fae0',
    );
  }
}
function building(c: CanvasRenderingContext2D, d: number, x: number, y: number) {
  rect(c, x + 3, y + 17, 36, 20, ['#aaa56d', '#8ea4a0', '#ad8866'][d]);
  rect(c, x + 3, y + 18, 36, 3, ['#d3cc91', '#c9d9cb', '#d8b78e'][d]);
  poly(c, [x, y + 17, x + 20, y + 4, x + 42, y + 17], ['#5d6d6c', '#8d6673', '#497d77'][d]);
  poly(c, [x + 5, y + 15, x + 20, y + 7, x + 35, y + 15], ['#8ba091', '#bb8e98', '#76b6a4'][d]);
  rect(c, x + 18, y + 24, 8, 13, '#243e4e');
  rect(c, x + 8, y + 23, 6, 7, '#354d57');
  rect(c, x + 30, y + 23, 6, 7, '#354d57');
  rect(c, x + 8, y + 23, 6, 2, '#d1e8cd');
  rect(c, x + 30, y + 23, 6, 2, '#d1e8cd');
  rect(c, x, y + 36, 42, 3, '#263c49');
}
export function render(
  c: CanvasRenderingContext2D,
  m: SupplyModel,
  config: SupplyConfig,
  lane: number,
) {
  c.save();
  c.textAlign = 'left';
  c.lineWidth = 1;
  c.setLineDash([]);
  rect(c, 0, 0, 640, 390, '#172333');
  // A tiled warehouse with lit clerestory windows and a steel inspection gantry.
  for (let row = 0; row < 15; row++) {
    rect(c, 0, 89 + row * 18, 640, 18, row % 2 ? '#30404c' : '#354751');
    for (let x = (row % 2) * 32; x < 640; x += 64) {
      rect(c, x, 89 + row * 18, 1, 18, '#22333f');
      rect(c, x + 2, 90 + row * 18, 58, 1, '#455965');
    }
  }
  for (let x = 18; x < 630; x += 80) {
    rect(c, x, 88, 62, 17, '#111f32');
    rect(c, x + 2, 90, 58, 12, '#436b79');
    rect(c, x + 3, 91, 56, 3, '#77a5a4');
    rect(c, x + 29, 90, 3, 13, '#253c4b');
  }
  panel(c, 7, 4, 630, 82, '#263548', '#64747c');
  for (let i = 0; i < 3; i++) portrait(c, i, 16 + i * 111, 6);
  panel(c, 356, 9, 273, 63, '#132c35', '#aa9761');
  label(c, 'SUPPLY THE PEOPLE', 369, 28, '#eee2aa', 15);
  label(
    c,
    `SHIFT ${m.shift}/${m.endless ? '∞' : '3'}   BUDGET ${m.budget}`,
    369,
    46,
    '#badbcc',
    11,
  );
  label(c, `SCORE ${m.score}  ·  BELLS ${m.bells}`, 369, 62, '#8eccc1', 10);
  // Conveyor beds retain exactly the original interaction coordinates.
  for (let row = 0; row < 3; row++) {
    const y = 109 + row * 79;
    rect(c, 18, y + 57, 496, 8, '#152637');
    rect(c, 28, y + 60, 11, 16, '#1d2d3b');
    rect(c, 468, y + 60, 11, 16, '#1d2d3b');
    rect(c, 30, y + 60, 3, 14, '#607079');
    rect(c, 470, y + 60, 3, 14, '#607079');
    panel(
      c,
      12,
      y - 2,
      505,
      61,
      row === lane ? '#78918e' : '#566d75',
      row === lane ? '#c4e4c0' : '#9baeb0',
    );
    rect(c, 20, y + 7, 489, 43, '#101e2d');
    for (let tile = 0; tile < 24; tile++) {
      const x = 20 + tile * 21;
      rect(c, x, y + 10, 19, 36, '#283e4b');
      rect(c, x + 1, y + 10, 17, 2, '#486273');
      rect(c, x + 1, y + 43, 17, 3, '#162a38');
      rect(c, x + 17, y + 12, 2, 30, '#1c303e');
      for (let notch = 0; notch < 4; notch++) rect(c, x + 5, y + 15 + notch * 7, 7, 1, '#334c59');
    }
    rect(c, 20, y + 3, 488, 3, '#adbcb3');
    rect(c, 20, y + 50, 488, 3, '#778e91');
    rect(c, 22, y + 53, 484, 2, '#243b4b');
    for (let x = 29; x < 510; x += 41) {
      rect(c, x, y + 4, 3, 2, '#394c59');
      rect(c, x, y + 51, 3, 2, '#354e5c');
    }
    if (row === lane) {
      poly(c, [3, y + 21, 11, y + 27, 3, y + 33], '#b7f6ce');
      rect(c, 21, y + 4, 12, 2, '#d5f6d4');
    }
    // Color-coded storefront gate with depth and a shared, unambiguous icon.
    const d = m.gates[row];
    panel(
      c,
      522,
      y - 2,
      108,
      61,
      ['#537a6f', '#795e73', '#4c7c83'][d],
      ['#bad5a2', '#ddbac7', '#a4e2d7'][d],
    );
    building(c, d, 529, y + 1);
    destinationIcon(c, d, 604, y + 19);
    rect(c, 528, y + 42, 96, 12, '#112937');
    label(c, ['SCHOOL △', 'CLINIC +', 'PANTRY ○'][d], 576, y + 51, '#e8e6c4', 10, true);
    if (m.event?.lane === row) {
      c.strokeStyle = m.event.activated ? '#ef927c' : '#edcc83';
      c.lineWidth = 2;
      c.strokeRect(13, y - 1, 503, 59);
      c.lineWidth = 1;
      for (let x = 24; x < 510; x += 35)
        poly(c, [x, y + 1, x + 9, y + 1, x + 5, y + 6, x - 4, y + 6], '#e5b576');
    }
  }
  for (const crate of m.crates) {
    const x = Math.round(crate.x),
      y = 119 + crate.lane * 79,
      market = config.variant === 'market';
    rect(c, x - 18, y + 32, 42, 5, '#081524');
    rect(c, x - 12, y + 37, 32, 2, '#112536');
    poly(
      c,
      [x - 18, y + 2, x - 10, y - 5, x + 20, y - 5, x + 20, y + 27, x + 14, y + 35, x - 18, y + 35],
      '#2a2625',
    );
    rect(c, x - 16, y + 3, 31, 30, market ? '#936877' : '#a47649');
    poly(
      c,
      [x - 16, y + 2, x - 9, y - 3, x + 18, y - 3, x + 12, y + 3],
      market ? '#c896a1' : '#d8b17a',
    );
    poly(
      c,
      [x + 15, y + 3, x + 19, y - 2, x + 19, y + 27, x + 15, y + 32],
      market ? '#5b3f56' : '#694c35',
    );
    for (let n = 0; n < 3; n++) {
      rect(c, x - 15, y + 4 + n * 10, 28, 2, market ? '#bb8997' : '#c39a62');
      rect(c, x - 15, y + 11 + n * 10, 28, 1, market ? '#684a5d' : '#725035');
    }
    rect(c, x - 14, y + 3, 4, 30, market ? '#d8abba' : '#e1bc85');
    rect(c, x + 8, y + 3, 4, 30, market ? '#c79daa' : '#d0ab75');
    for (const px of [x - 13, x + 9])
      for (const py of [y + 5, y + 28]) rect(c, px, py, 2, 2, '#514941');
    rect(c, x - 10, y + 7, 19, 22, '#243b3f');
    rect(c, x - 9, y + 8, 17, 20, ['#8bba9e', '#c393a7', '#82bab4'][crate.destination]);
    destinationIcon(c, crate.destination, x, y + 18);
    if (crate.sleeve) {
      panel(c, x - 24, y - 11, 49, 15, '#c99b45', '#fff0aa', '#563d2d');
      rect(c, x - 23, y - 8, 47, 1, '#f1d079');
      label(c, 'TRUMP +8', x, y, '#4d3133', 8, true);
      rect(c, x + 12, y + 5, 3, 27, '#e3bd6b');
    }
  }
  panel(c, 6, 345, 628, 42, '#162d3b', '#5a7e83');
  for (let d = 0; d < 3; d++) {
    const x = 18 + d * 158;
    label(
      c,
      `${['SCHOOL', 'CLINIC', 'PANTRY'][d]} ${m.delivered[d]}/8`,
      x,
      359,
      ['#c6e6b0', '#f0becd', '#b1ede0'][d],
      10,
    );
    rect(c, x, 365, 139, 7, '#091c2a');
    rect(
      c,
      x + 1,
      366,
      Math.min(137, (m.delivered[d] / 8) * 137),
      4,
      ['#88b897', '#bc839b', '#6eaea8'][d],
    );
    rect(c, x + 1, 366, Math.min(137, (m.delivered[d] / 8) * 137), 1, '#d8eccc');
  }
  label(c, `TOTAL ${m.delivered.reduce((a, b) => a + b, 0)}`, 500, 359, '#efdaaa', 10);
  label(c, `BIN ${m.recovery.length}/${m.capacity}`, 500, 375, '#a8c1c1', 10);
  if (m.event) {
    const name = ['TRUMP: BRANDING', 'VANCE: VIP DIVERSION', 'JOHNSON: FREEZE'][m.event.person];
    rect(c, 356, 73, 271, 13, '#583b45');
    label(
      c,
      `${name}${m.event.blocked ? ' BLOCKED' : !m.event.activated ? ' …' : ''}`,
      362,
      83,
      '#ffdfa3',
      9,
    );
  }
  if (m.bellTime > 0) {
    label(c, 'COLLECTIVE BARGAINING', 320, 99, '#e2f7bb', 9, true);
  }
  if (['title', 'won', 'lost'].includes(m.phase)) {
    panel(c, 48, 136, 544, 150, '#11263beF', '#bdad79');
    rect(c, 55, 143, 530, 3, '#3b6573');
    rect(c, 55, 276, 530, 3, '#345267');
    for (const x of [64, 563]) {
      rect(c, x, 158, 11, 11, '#bda76d');
      rect(c, x + 3, 161, 5, 5, '#f4d996');
    }
    label(
      c,
      m.phase === 'title'
        ? 'EVERYBODY EATS.'
        : m.phase === 'won'
          ? 'NEIGHBORHOOD STOCKED!'
          : 'TRY ANOTHER SHIFT',
      320,
      179,
      m.phase === 'lost' ? '#f1b6a5' : '#c5f4ce',
      24,
      true,
    );
    label(
      c,
      m.phase === 'title'
        ? 'Strip gold sleeves. Match △ + ○ gates.'
        : `Delivered ${m.delivered.reduce((a, b) => a + b, 0)} · Score ${m.score}`,
      320,
      214,
      '#e9e4c9',
      12,
      true,
    );
    label(
      c,
      m.phase === 'title'
        ? 'Use Start above to open the cooperative.'
        : 'Restart above to begin a new campaign.',
      320,
      244,
      '#a7c7cd',
      11,
      true,
    );
  }
  c.restore();
}
