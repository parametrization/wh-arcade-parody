import type { TycoonConfig } from './config';
import { catchWidth, laneX, resourceNames, type TycoonModel } from './model';
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
function resource(c: CanvasRenderingContext2D, type: number, x: number, y: number) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (type === 0) {
    poly(c, [-15, -13, 7, -16, 16, -11, 16, 14, -6, 17, -15, 12], '#172438');
    rect(c, -12, -12, 22, 26, '#9f5369');
    rect(c, -10, -11, 18, 23, '#cf8493');
    rect(c, -10, -11, 18, 3, '#e7a5aa');
    rect(c, -12, -12, 4, 26, '#673e59');
    poly(c, [10, -11, 14, -9, 14, 12, 10, 14], '#e4d9b5');
    rect(c, 11, -6, 2, 16, '#aaac9a');
    rect(c, -4, -3, 10, 2, '#f3dcaf');
    rect(c, -4, 2, 8, 2, '#efd3a4');
    rect(c, -5, 10, 5, 7, '#d4b66f');
  } else if (type === 1) {
    rect(c, -8, -17, 16, 6, '#122c3a');
    rect(c, -5, -15, 10, 3, '#8ab6b3');
    rect(c, -17, -11, 34, 27, '#102636');
    rect(c, -15, -9, 30, 23, '#6ea59e');
    rect(c, -15, -9, 30, 4, '#d2e5cd');
    rect(c, -15, 10, 30, 4, '#426e78');
    rect(c, 11, -4, 4, 14, '#527e86');
    rect(c, -11, -5, 3, 14, '#9dd1bf');
    rect(c, -3, -7, 6, 19, '#eef0d1');
    rect(c, -9, -1, 18, 6, '#eef0d1');
    rect(c, -2, -6, 3, 16, '#fffbe4');
  } else if (type === 2) {
    poly(
      c,
      [
        -13, -15, -3, -17, 6, -11, 7, -2, 2, 5, 8, 11, 14, 7, 18, 12, 12, 18, 5, 18, -5, 7, -13, 4,
        -17, -4,
      ],
      '#3f342d',
    );
    poly(c, [-12, -12, -3, -14, 3, -10, 4, -3, 0, 2, -6, 3, -12, 0, -14, -5], '#efcb73');
    poly(c, [-9, -9, -4, -10, -1, -7, -2, -3, -6, -2, -10, -5], '#3c5158');
    poly(c, [-1, 2, 3, 0, 15, 12, 11, 15, 7, 11, 4, 13, -2, 7], '#ddb66b');
    rect(c, 10, 8, 5, 3, '#ffdda0');
    rect(c, -11, -12, 6, 2, '#fff0bc');
  } else if (type === 3) {
    poly(
      c,
      [-8, -17, 7, -17, 15, -10, 18, -2, 16, 9, 8, 16, -7, 17, -15, 10, -18, -1, -14, -11],
      '#725332',
    );
    poly(
      c,
      [-7, -15, 6, -15, 13, -9, 15, -1, 13, 8, 6, 13, -6, 14, -13, 8, -15, -1, -11, -10],
      '#d8a74f',
    );
    poly(c, [-6, -12, 5, -12, 11, -7, 12, 2, 8, 10, -5, 11, -11, 6, -12, -2, -8, -9], '#f1d082');
    rect(c, -9, -11, 12, 2, '#fff1bc');
    rect(c, -1, -10, 3, 21, '#916439');
    rect(c, -6, -6, 11, 3, '#9d6f3c');
    rect(c, -6, -3, 4, 5, '#9d6f3c');
    rect(c, -5, 1, 10, 3, '#9d6f3c');
    rect(c, 2, 3, 4, 5, '#9d6f3c');
    rect(c, -6, 7, 11, 3, '#9d6f3c');
  } else {
    poly(
      c,
      [
        -10, -17, 8, -17, 16, -9, 17, 3, 10, 14, 3, 17, 5, 20, -3, 20, -1, 17, -11, 13, -17, 3, -16,
        -9,
      ],
      '#826237',
    );
    poly(c, [-9, -15, 7, -15, 14, -8, 15, 3, 9, 12, 2, 15, -8, 12, -14, 3, -13, -8], '#c49a56');
    poly(c, [-7, -12, 5, -12, 10, -7, 12, 2, 7, 9, -6, 9, -10, 2, -10, -6], '#384355');
    rect(c, -11, -10, 3, 6, '#ffe1a0');
    label(c, 'EMPTY', 0, 3, '#efdca5', 8, true);
    poly(c, [-1, 20, 1, 20, -1, 26, 2, 29, 0, 30, -3, 26], '#bcb68f');
  }
  c.restore();
}
function neighborhood(
  c: CanvasRenderingContext2D,
  track: number,
  level: number,
  x: number,
  y: number,
) {
  // Small dimensional streetscape evolves from a plot to a two-story service.
  rect(c, x, y + 45, 191, 7, '#142637');
  rect(c, x + 2, y + 45, 187, 2, '#78908a');
  if (!level) {
    rect(c, x + 5, y + 27, 61, 18, '#455b61');
    for (let post = 0; post < 6; post++) {
      rect(c, x + 9 + post * 10, y + 24, 3, 21, '#bcaa7d');
      rect(c, x + 8 + post * 10, y + 27, 7, 4, '#d2bc85');
    }
    rect(c, x + 5, y + 32, 61, 3, '#9a855e');
    return;
  }
  const h = level === 1 ? 27 : 38;
  const top = y + 44 - h;
  poly(c, [x + 10, top, x + 60, top, x + 69, top + 6, x + 69, y + 44, x + 10, y + 44], '#283e4b');
  rect(c, x + 12, top + 2, 46, h - 2, ['#afb082', '#9eb9ad', '#c09b83'][track]);
  poly(
    c,
    [x + 58, top + 2, x + 67, top + 7, x + 67, y + 44, x + 58, y + 44],
    ['#707c67', '#68898b', '#8c6c64'][track],
  );
  poly(
    c,
    [x + 7, top + 1, x + 34, top - 10, x + 63, top + 1],
    ['#547b7a', '#a57080', '#4c788a'][track],
  );
  poly(
    c,
    [x + 12, top - 1, x + 34, top - 8, x + 56, top - 1],
    ['#89ada0', '#d19a9f', '#82b2be'][track],
  );
  for (let row = 0; row < level; row++)
    for (let col = 0; col < 3; col++) {
      rect(c, x + 18 + col * 13, top + 7 + row * 12, 7, 8, '#375a6b');
      rect(c, x + 18 + col * 13, top + 7 + row * 12, 7, 2, '#e6e8bd');
      rect(c, x + 21 + col * 13, top + 9 + row * 12, 1, 6, '#8bacaa');
    }
  rect(c, x + 31, y + 32, 10, 12, '#243c51');
  rect(c, x + 32, y + 33, 7, 2, '#9dc5c0');
  rect(c, x + 36, y + 39, 2, 2, '#e7d095');
  if (track === 1) {
    rect(c, x + 31, top - 5, 7, 3, '#fff2de');
    rect(c, x + 33, top - 7, 3, 7, '#fff2de');
  }
}
export function render(c: CanvasRenderingContext2D, m: TycoonModel, config: TycoonConfig) {
  c.save();
  c.lineWidth = 1;
  c.textAlign = 'left';
  c.setLineDash([]);
  rect(c, 0, 0, 640, 410, '#112438');
  // Dusk sky, distant rooftops and the theatrical gilded facade.
  const sky = ['#323452', '#3b405e', '#49546d', '#63767e', '#86988d'];
  for (let band = 0; band < 5; band++) rect(c, 0, 85 + band * 50, 640, 50, sky[band]);
  for (let i = 0; i < 22; i++) {
    const x = i * 31,
      h = 18 + ((i * 19) % 61);
    rect(c, x, 274 - h, 26, h, '#354f64');
    rect(c, x + 3, 279 - h, 21, 3, '#5d7783');
    for (let win = 0; win < 3; win++) rect(c, x + 5 + win * 6, 286 - h, 3, 4, '#baa780');
  }
  rect(c, 46, 109, 548, 174, '#344153');
  rect(c, 54, 109, 532, 7, '#68706d');
  for (let i = 0; i < 6; i++) {
    const x = 67 + i * 87;
    rect(c, x, 119, 42, 132, '#243348');
    rect(c, x + 3, 123, 36, 126, '#455464');
    for (let row = 0; row < 4; row++) {
      rect(c, x + 7, 127 + row * 30, 28, 22, '#203247');
      rect(c, x + 8, 128 + row * 30, 26, 4, '#6d7d80');
      rect(c, x + 19, 128 + row * 30, 3, 20, '#57676e');
      rect(c, x + 8, 140 + row * 30, 26, 2, '#4e626d');
    }
    rect(c, x + 44, 113, 13, 155, '#9c916e');
    rect(c, x + 45, 115, 3, 151, '#d0ba83');
    rect(c, x + 54, 115, 3, 151, '#665f56');
  }
  rect(c, 39, 99, 562, 11, '#b79c63');
  rect(c, 39, 100, 562, 3, '#e5c889');
  rect(c, 44, 110, 552, 3, '#514e4d');
  poly(c, [32, 100, 320, 73, 608, 100], '#675c52');
  poly(c, [47, 99, 320, 77, 593, 99], '#b69d6c');
  for (let i = 0; i < 3; i++) {
    const x = laneX[i];
    panel(c, x - 27, 83, 54, 17, '#4b5558', '#f1dca2');
    rect(c, x - 20, 93, 40, 8, '#121f31');
    rect(c, x - 15, 94, 30, 3, '#7f8b82');
  }
  panel(c, 7, 4, 630, 77, '#28364a', '#76848b');
  for (let i = 0; i < 3; i++) portrait(c, i, 16 + i * 111, 5);
  panel(c, 356, 9, 273, 62, '#18313d', '#b9a879');
  label(c, 'TRICKLE-DOWN TYCOON', 369, 27, '#f1d99f', 13);
  label(c, `ROUND ${m.round}/5   SCORE ${m.score}`, 369, 44, '#c4dccd', 11);
  label(c, `NET ${'♥'.repeat(m.integrity)}  AUDIT ${m.audits}`, 369, 62, '#9ed4c4', 10);
  // A subtle landing marker keeps the action readable over the detailed scene.
  for (let i = 0; i < 3; i++) {
    const x = laneX[i];
    label(c, `${i + 1}`, x, 117, '#b1c4c1', 9, true);
    rect(c, x - 18, 281, 36, 2, '#bed9c0');
    rect(c, x - 15, 284, 30, 1, '#617f88');
  }
  if (m.event) {
    const names = ['TRUMP: NAMING RIGHTS', 'VANCE: PUBLICITY STORM', 'JOHNSON: BUDGET SCISSORS'];
    panel(c, 150, 127, 340, 24, '#613f4f', '#d1a272');
    label(
      c,
      `${m.event.time < 2 ? 'INCOMING · ' : ''}${names[m.event.person]}`,
      320,
      143,
      '#ffdfa7',
      10,
      true,
    );
    if (m.event.time >= 2 && m.event.person === 0) {
      panel(c, 7, 158, 78, 104, '#5e514b', '#dfbb6f');
      label(c, 'TRUMP', 46, 186, '#f5d78f', 12, true);
      label(c, 'TOWER', 46, 204, '#f5d78f', 12, true);
      for (let x = 18; x < 78; x += 12) rect(c, x, 214, 4, 33, '#c3a36c');
    }
    if (m.event.time >= 2 && m.event.person === 1) {
      for (let i = 0; i < 22; i++) {
        const x = 20 + ((i * 47) % 602),
          y = 164 + ((i * 29) % 100);
        rect(c, x, y, 3, 6, ['#d88caa', '#d4b86f', '#81bdb4'][i % 3]);
        rect(c, x + 2, y + 1, 3, 2, '#f3ddba');
      }
    }
    if (m.event.time >= 2 && m.event.person === 2) {
      const x = m.netX + catchWidth(m) + 9;
      poly(c, [x, 292, x + 3, 290, x + 16, 305, x + 13, 308], '#b9c9c7');
      poly(c, [x + 13, 291, x + 16, 293, x + 3, 308, x, 305], '#e1e8d4');
      rect(c, x - 3, 287, 7, 7, '#a55b6b');
      rect(c, x + 12, 287, 7, 7, '#a55b6b');
    }
  }
  // Resources emerge from below the gantry; keep previews off the name plaques.
  c.save();
  c.beginPath();
  c.rect(0, 83, 640, 252);
  c.clip();
  for (const target of m.targets) {
    const x = laneX[target.lane],
      y = target.warning > 0 ? 92 : target.y;
    rect(c, x - 12, Math.min(331, y + 20), 26, 3, '#162b3c88');
    if (target.warning > 0) {
      c.save();
      c.translate(x, y);
      c.scale(0.6, 0.6);
      resource(c, target.type, 0, 0);
      c.restore();
    } else resource(c, target.type, x, y);
    if (target.warning > 0) {
      panel(c, x - 53, 101, 106, 17, '#18364a', '#8cacac');
      label(c, resourceNames[target.type].toUpperCase(), x, 113, '#fff0bc', 9, true);
    }
  }
  c.restore();
  // Woven net, rim and cloth panels remain centered on the real catch position.
  const width = catchWidth(m),
    x = m.netX;
  poly(
    c,
    [x - width - 2, 304, x + width + 2, 304, x + width - 10, 334, x - width + 10, 334],
    '#102b3d',
  );
  poly(
    c,
    [x - width, 306, x + width, 306, x + width - 12, 331, x - width + 12, 331],
    m.catchTime > 0 ? '#8ce4c4' : m.cooldown > 0 ? '#637e87' : '#559e9f',
  );
  for (let offset = -width + 10; offset < width - 4; offset += 12) {
    poly(
      c,
      [x + offset, 307, x + offset + 3, 307, x + offset + 9, 330, x + offset + 6, 330],
      config.variant === 'basket' ? '#bb9764' : '#254c61',
    );
    rect(c, x + offset + 3, 310, 2, 4, '#a1d9c0');
  }
  for (let y = 313; y < 329; y += 7)
    rect(
      c,
      x - width + 8,
      y,
      width * 2 - 16,
      2,
      config.variant === 'basket' ? '#d8b97a' : '#89c2b3',
    );
  rect(c, x - width - 2, 301, width * 2 + 4, 5, '#d0d7ac');
  rect(c, x - width, 302, width * 2, 2, m.catchTime > 0 ? '#f4ffd1' : '#a4c7b4');
  if (config.variant === 'patchwork') {
    rect(c, x - 12, 313, 16, 13, '#cb9976');
    rect(c, x - 10, 315, 12, 9, '#e8bb85');
    rect(c, x + 13, 310, 12, 12, '#7da6c1');
    for (let n = 0; n < 4; n++) rect(c, x - 11 + n * 4, 312, 1, 3, '#534d50');
  }
  // Outstretched hands and rolled-up sleeves, rather than disembodied bars.
  for (const side of [-1, 1]) {
    const hx = x + side * (width + 5);
    rect(c, hx - 5, 286, 10, 16, '#7f6853');
    rect(c, hx - 4, 285, 8, 13, '#e5ba8f');
    rect(c, hx - 3, 286, 6, 4, '#f5d7aa');
    rect(c, hx - 5, 298, 10, 5, '#dce1c4');
    rect(c, hx - 6, 303, 12, 12, '#3d7082');
    rect(c, hx - 5, 304, 3, 10, '#77a0aa');
  }
  panel(c, 3, 342, 634, 66, '#1b3244', '#5b7883');
  for (let track = 0; track < 3; track++) {
    const bx = 13 + track * 211;
    neighborhood(c, track, m.levels[track], bx, 350);
    label(
      c,
      ['EDUCATION', 'CARE', 'HOMES'][track],
      bx + 79,
      367,
      ['#dbe7b8', '#c5e6d8', '#ead0b2'][track],
      10,
    );
    label(c, `LEVEL ${m.levels[track]}/2`, bx + 79, 383, '#b4c8c8', 10);
    rect(c, bx + 79, 390, 100, 5, '#102235');
    rect(c, bx + 80, 391, m.levels[track] * 48, 3, '#82b6a7');
  }
  if (m.freeze > 0) {
    c.strokeStyle = '#a0e8db';
    c.lineWidth = 3;
    c.strokeRect(5, 98, 630, 237);
    c.lineWidth = 1;
    label(c, 'PUBLIC AUDIT · READ THE FINE PRINT', 320, 272, '#e3f7d6', 10, true);
  }
  if (['title', 'won', 'lost'].includes(m.phase)) {
    panel(c, 41, 139, 558, 139, '#122a3eef', '#d4ba7f');
    rect(c, 48, 146, 544, 3, '#446675');
    rect(c, 48, 268, 544, 3, '#3b6070');
    label(
      c,
      m.phase === 'title'
        ? 'BUILD THE SAFETY NET.'
        : m.phase === 'won'
          ? 'THE PUBLIC DIVIDEND!'
          : 'THE NET NEEDS REPAIRS',
      320,
      177,
      m.phase === 'lost' ? '#ffbca7' : '#d1f2cb',
      22,
      true,
    );
    label(
      c,
      m.phase === 'title'
        ? 'Catch books, care, keys and coins. Let promises pass.'
        : `Community levels ${m.levels.join(' / ')} · Score ${m.score}`,
      320,
      213,
      '#eae6cc',
      11,
      true,
    );
    label(
      c,
      m.phase === 'title'
        ? 'Use Start above to begin.'
        : 'Restart above for another five-round campaign.',
      320,
      245,
      '#a6cbd1',
      11,
      true,
    );
  }
  c.restore();
}
