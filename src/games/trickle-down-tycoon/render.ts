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
  shadow(c, x + w * 0.53, y + h + 3, w * 0.49, 5, 0.22);
  poly(
    c,
    [x, y, x + w, y, x + w + 3, y + h - 3, x + w - 2, y + h + 3, x + 3, y + h + 3, x - 2, y + 3],
    dark,
  );
  const surface = c.createLinearGradient(x, y, x + w * 0.3, y + h);
  surface.addColorStop(0, light);
  surface.addColorStop(0.1, base);
  surface.addColorStop(1, dark);
  c.fillStyle = surface;
  c.fillRect(x + 2, y + 2, w - 4, h - 4);
  poly(c, [x, y, x + w, y, x + w - 5, y + 4, x + 5, y + 4], light);
  poly(c, [x, y, x + 5, y + 4, x + 5, y + h - 5, x, y + h], base);
  poly(c, [x + w, y, x + w, y + h, x + w - 5, y + h - 5, x + w - 5, y + 4], dark);
  poly(c, [x, y + h, x + w, y + h, x + w - 5, y + h - 5, x + 5, y + h - 5], '#0a192b');
  for (const px of [x + 8, x + w - 10]) {
    c.fillStyle = light;
    c.beginPath();
    c.arc(px, y + 8, 1.5, 0, Math.PI * 2);
    c.fill();
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
function tone(color: string, amount: number) {
  const value = Number.parseInt(color.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`;
}
function block(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
  color: string,
) {
  poly(c, [x, y, x + w, y, x + w, y + h, x, y + h], color);
  poly(
    c,
    [x, y, x + depth, y - depth * 0.55, x + w + depth, y - depth * 0.55, x + w, y],
    tone(color, 36),
  );
  poly(
    c,
    [x + w, y, x + w + depth, y - depth * 0.55, x + w + depth, y + h - depth * 0.55, x + w, y + h],
    tone(color, -34),
  );
  poly(c, [x, y, x + w, y, x + w * 0.72, y + h * 0.45, x, y + h * 0.75], tone(color, 8));
}
function shadow(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha = 0.25,
) {
  c.fillStyle = `rgba(3,12,22,${alpha})`;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
export function portrait(c: CanvasRenderingContext2D, person: number, x: number, y: number) {
  c.save();
  c.translate(x, y);
  const backdrop = c.createLinearGradient(0, 0, 100, 70);
  backdrop.addColorStop(0, '#788b94');
  backdrop.addColorStop(0.35, '#3a566b');
  backdrop.addColorStop(1, '#102439');
  c.fillStyle = backdrop;
  c.fillRect(0, 0, 100, 76);
  poly(c, [0, 0, 26, 0, 77, 64, 42, 64], '#97afbd25');
  poly(c, [100, 0, 82, 0, 58, 64, 86, 64], '#d9e4d515');
  shadow(c, 51, 63, 34, 9, 0.5);
  const jacket = ['#305b8c', '#3b526c', '#47516c'][person];
  poly(c, [15, 62, 22, 47, 36, 40, 61, 40, 77, 47, 87, 63], tone(jacket, -26));
  poly(c, [22, 47, 38, 41, 48, 51, 42, 64, 17, 64], tone(jacket, 22));
  poly(c, [38, 41, 48, 49, 59, 41, 71, 46, 64, 64, 41, 64], jacket);
  poly(c, [71, 46, 79, 48, 86, 64, 64, 64], tone(jacket, -20));
  poly(c, [26, 47, 38, 44, 33, 61, 21, 63], tone(jacket, 35));
  poly(c, [38, 41, 49, 48, 59, 40, 56, 58, 43, 58], '#ced9d5');
  poly(c, [39, 42, 48, 47, 42, 52, 34, 45], '#f4f1df');
  poly(c, [58, 41, 49, 47, 54, 53, 64, 43], '#f2ecdd');
  poly(c, [47, 47, 52, 47, 54, 51, 51, 55, 54, 66, 47, 66, 47, 55, 45, 51], '#a83d53');
  poly(c, [48, 49, 51, 49, 49, 62, 47, 65], '#e57377');
  poly(c, [33, 44, 43, 54, 38, 60, 27, 48], tone(jacket, -5));
  poly(c, [64, 43, 55, 54, 60, 61, 72, 47], tone(jacket, -10));
  const skin = ['#e2a273', '#d1ad92', '#dbbba0'][person];
  // Faceted forehead, temples, cheekbones and jaw form one sculpted low-poly mesh.
  poly(c, [29, 17, 37, 7, 56, 6, 68, 16, 70, 31, 62, 42, 50, 46, 37, 42, 29, 32], tone(skin, -54));
  poly(c, [31, 17, 38, 9, 54, 8, 64, 14, 66, 23, 57, 22, 44, 21], tone(skin, 20));
  poly(c, [31, 17, 44, 21, 39, 28, 32, 30], tone(skin, 4));
  poly(c, [44, 21, 57, 22, 58, 31, 48, 34, 39, 28], tone(skin, 10));
  poly(c, [64, 14, 67, 20, 67, 31, 58, 31, 57, 22], tone(skin, -29));
  poly(c, [32, 30, 39, 28, 48, 34, 44, 40, 37, 39], tone(skin, -8));
  poly(c, [48, 34, 58, 31, 64, 34, 58, 40, 50, 44, 44, 40], tone(skin, -21));
  poly(c, [37, 39, 44, 40, 50, 44, 43, 43], tone(skin, -35));
  poly(c, [29, 23, 33, 22, 33, 32, 29, 29], tone(skin, -5));
  poly(c, [67, 23, 71, 22, 70, 30, 66, 32], tone(skin, -33));
  poly(c, [39, 21, 46, 21, 47, 25, 40, 25], '#f0e5d7');
  poly(c, [53, 22, 60, 21, 63, 24, 54, 25], '#f0e5d7');
  rect(c, 42, 22, 3, 3, '#26354a');
  rect(c, 55, 22, 3, 3, '#26354a');
  poly(c, [49, 22, 46, 32, 50, 34, 54, 31], tone(skin, -44));
  poly(c, [49, 22, 49, 31, 52, 31], tone(skin, 34));
  poly(c, [42, 35, 49, 36, 57, 34, 54, 38, 45, 38], tone(skin, -48));
  poly(c, [45, 36, 54, 35, 53, 37, 46, 37], '#e9ceb8');
  if (person === 0) {
    poly(
      c,
      [28, 18, 28, 9, 36, 5, 56, 4, 68, 8, 70, 13, 59, 17, 45, 13, 35, 19, 32, 26],
      '#b38a44',
    );
    poly(c, [28, 10, 37, 5, 57, 5, 67, 8, 58, 11, 41, 10, 32, 16], '#edcc7a');
    poly(c, [37, 5, 57, 5, 64, 7, 48, 8], '#ffe4a1');
    poly(c, [32, 16, 42, 10, 53, 12, 44, 15, 35, 20], '#d9b46d');
    poly(c, [59, 11, 69, 10, 65, 16, 58, 18, 51, 14], '#bd914e');
    poly(c, [37, 19, 45, 18, 47, 21, 39, 22], '#b78f56');
    poly(c, [54, 19, 61, 18, 64, 21, 54, 22], '#af8049');
    block(c, 76, 35, 11, 8, 3, '#d4af58');
    block(c, 79, 29, 5, 6, 2, '#a6874c');
    rect(c, 77, 35, 10, 2, '#ffe4a0');
  } else if (person === 1) {
    poly(
      c,
      [29, 24, 29, 13, 35, 7, 48, 3, 62, 7, 67, 14, 67, 22, 60, 16, 53, 12, 39, 14, 34, 22],
      '#342c2d',
    );
    poly(c, [30, 14, 36, 8, 49, 5, 61, 8, 53, 10, 40, 12], '#705443');
    poly(c, [33, 15, 42, 11, 54, 10, 46, 15, 36, 19], '#584539');
    poly(
      c,
      [32, 28, 40, 31, 45, 33, 54, 33, 61, 29, 65, 29, 62, 40, 51, 45, 40, 42, 34, 36],
      '#584237',
    );
    poly(c, [39, 34, 48, 37, 59, 33, 57, 39, 50, 42, 43, 39], '#87654b');
    poly(c, [44, 33, 55, 33, 53, 35, 46, 35], '#e1b693');
    rect(c, 38, 18, 9, 2, '#574032');
    rect(c, 53, 18, 9, 2, '#574032');
    block(c, 79, 33, 3, 23, 2, '#b69a64');
    shadow(c, 80, 57, 7, 2);
    poly(c, [73, 37, 79, 37, 85, 42, 91, 43, 91, 47, 83, 46, 77, 41, 73, 41], '#ba5a72');
  } else {
    poly(
      c,
      [29, 23, 29, 14, 35, 7, 48, 5, 60, 7, 67, 15, 66, 25, 62, 20, 59, 13, 45, 12, 36, 17, 34, 26],
      '#45372e',
    );
    poly(c, [31, 14, 36, 8, 49, 7, 59, 9, 48, 10, 40, 14, 33, 18], '#8e7353');
    poly(c, [40, 8, 53, 7, 60, 9, 50, 10], '#b29771');
    c.strokeStyle = '#283342';
    c.lineWidth = 2;
    c.strokeRect(36, 20, 13, 9);
    c.strokeRect(51, 20, 13, 9);
    c.beginPath();
    c.moveTo(49, 23);
    c.lineTo(51, 23);
    c.stroke();
    poly(c, [37, 21, 47, 21, 40, 26, 37, 26], '#cbe2dc55');
    poly(c, [52, 21, 62, 21, 56, 26, 52, 26], '#cbe2dc44');
    block(c, 76, 31, 14, 21, 2, '#a49678');
    poly(c, [77, 32, 88, 32, 88, 49, 77, 49], '#e0d6b9');
    rect(c, 80, 29, 6, 4, '#7c7464');
    for (let row = 0; row < 3; row++) rect(c, 79, 36 + row * 4, 7, 1, '#8c887a');
  }
  poly(c, [0, 62, 100, 62, 96, 76, 4, 76], '#132a3d');
  poly(c, [0, 62, 100, 62, 97, 64, 3, 64], '#a79c78');
  label(c, ['DONALD TRUMP', 'JD VANCE', 'MIKE JOHNSON'][person], 50, 73, '#efe1ba', 9, true);
  c.restore();
}

function resource(c: CanvasRenderingContext2D, type: number, x: number, y: number) {
  c.save();
  c.translate(x, y);
  if (type === 0) {
    shadow(c, 3, 17, 17, 3, 0.22);
    poly(c, [-16, -11, 7, -16, 17, -9, 16, 14, -6, 18, -16, 12], '#523f54');
    poly(c, [-14, -10, 7, -14, 8, 12, -6, 15, -14, 11], '#bb6b87');
    poly(c, [-14, -10, -9, -11, -8, 14, -13, 12], '#794d6d');
    poly(c, [-9, -11, 7, -14, 8, -9, -8, -6], '#de9ca6');
    poly(c, [8, -13, 15, -8, 14, 12, 8, 14], '#ddd6bd');
    poly(c, [9, -8, 13, -5, 12, 11, 9, 12], '#adafa6');
    poly(c, [-8, -6, 7, -9, 8, 11, -7, 14], '#aa5f80');
    poly(c, [-4, -2, 4, -4, 4, -1, -4, 1], '#efdbad');
    poly(c, [-4, 4, 3, 2, 3, 4, -4, 6], '#eed2a5');
    poly(c, [-3, 12, 1, 11, 1, 18, -2, 16, -4, 18], '#d4b77f');
  } else if (type === 1) {
    block(c, -15, -9, 25, 23, 6, '#75aaa8');
    poly(c, [-15, -9, -10, -14, 16, -14, 10, -9], '#c0d8c7');
    poly(c, [10, -9, 16, -14, 16, 9, 10, 14], '#3e6d82');
    poly(c, [-8, -14, -8, -19, 4, -19, 8, -15, 4, -14, 2, -17, -5, -17, -5, -14], '#3c606e');
    poly(
      c,
      [-4, -7, 2, -7, 2, -1, 8, -1, 8, 5, 2, 5, 2, 11, -4, 11, -4, 5, -10, 5, -10, -1, -4, -1],
      '#eff1d8',
    );
    poly(c, [-3, -6, 0, -6, 0, 10, -3, 10], '#fff8e5');
  } else if (type === 2) {
    poly(
      c,
      [
        -12, -15, -3, -17, 5, -12, 8, -5, 4, 3, 0, 6, 12, 16, 16, 11, 19, 15, 13, 20, 8, 20, -6, 8,
        -14, 3, -18, -5,
      ],
      '#866b46',
    );
    poly(c, [-11, -13, -3, -15, 4, -10, 5, -3, 0, 3, -8, 3, -14, -3, -14, -8], '#e9c986');
    poly(c, [-11, -13, -3, -15, 4, -10, -3, -9, -9, -7], '#ffe5ac');
    poly(c, [-3, -9, 4, -10, 5, -3, 0, 3, -2, -2], '#c5a16b');
    poly(c, [-8, -8, -3, -10, 0, -7, -1, -2, -6, -1, -10, -4], '#344f62');
    poly(c, [-2, 3, 2, 2, 13, 13, 9, 17, 4, 12, 1, 14, -5, 7], '#dfbd7b');
    poly(c, [1, 4, 4, 5, 12, 13, 10, 14], '#fff0b5');
  } else {
    const sides = type === 3 ? 10 : 9,
      radius = type === 3 ? 17 : 18;
    const points: number[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides;
      points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    const rim = points.map((v, i) => v + (i % 2 ? 2 : 3));
    poly(c, rim, type === 3 ? '#997848' : '#806b52');
    for (let i = 0; i < sides; i++) {
      const n = (i + 1) % sides;
      poly(
        c,
        [0, -1, points[i * 2], points[i * 2 + 1], points[n * 2], points[n * 2 + 1]],
        tone(
          type === 3 ? '#dfbf75' : '#bca474',
          Math.round(Math.cos((i * Math.PI * 2) / sides + 1) * 32),
        ),
      );
    }
    if (type === 3) {
      const inner = points.map((v) => v * 0.69);
      poly(c, inner, '#e3c486');
      poly(c, [-6, -10, 2, -12, 9, -7, 2, -6, -6, -3], '#f4dfaa');
      label(c, '$', 0, 8, '#8b6b43', 20, true);
    } else {
      poly(c, [-11, -6, -4, -11, 5, -10, 12, -3, 9, 8, 0, 12, -10, 6], '#344d61');
      label(c, 'EMPTY', 0, 4, '#efdfbd', 8, true);
      poly(c, [-2, 18, 3, 18, 1, 22, 3, 26, 0, 28, -2, 23], '#c5b992');
    }
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
  shadow(c, x + 47, y + 47, 40, 5, 0.25);
  poly(c, [x, y + 45, x + 184, y + 45, x + 191, y + 49, x + 7, y + 53], '#243e53');
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
  const sky = c.createLinearGradient(0, 0, 0, 340);
  sky.addColorStop(0, '#506c91');
  sky.addColorStop(1, '#cfdbca');
  c.fillStyle = sky;
  c.fillRect(0, 0, 640, 342);
  // Symmetric pale mansion, columned portico and recessed sash windows.
  block(c, 24, 80, 580, 202, 8, '#d4d8ca');
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 12; col++) {
      const x = 38 + col * 48,
        y = 108 + row * 75;
      block(c, x, y, 24, 48, 2, '#f2eedb');
      rect(c, x + 3, y + 3, 18, 41, '#3b5668');
      rect(c, x + 11, y + 3, 2, 41, '#ced7cb');
      rect(c, x + 3, y + 22, 18, 2, '#ced7cb');
    }
  poly(c, [14, 80, 320, 24, 624, 80], '#eeeada');
  poly(c, [32, 76, 320, 36, 607, 76], '#c5cbbb');
  rect(c, 18, 79, 602, 8, '#f8f0d9');
  for (const x of [235, 270, 370, 405]) {
    block(c, x - 7, 86, 14, 186, 3, '#e9e8d6');
    rect(c, x - 10, 87, 23, 7, '#fff4d9');
    rect(c, x - 10, 267, 24, 9, '#f5ecd5');
  }
  rect(c, 312, 8, 3, 24, '#d7ded9');
  poly(c, [315, 8, 342, 11, 338, 22, 315, 19], '#e4d5c4');
  rect(c, 315, 8, 10, 7, '#436383');
  for (let k = 0; k < 3; k++) rect(c, 326, 11 + k * 3, 13, 1, '#ba6b70');
  poly(c, [0, 279, 640, 279, 640, 342, 0, 342], '#8d9d91');
  for (let k = -2; k < 9; k++) {
    c.strokeStyle = '#d6dfc355';
    c.beginPath();
    c.moveTo(320 + (k * 96 - 320) * 0.5, 280);
    c.lineTo(k * 96, 342);
    c.stroke();
  }
  for (const y of [292, 313, 339]) rect(c, 0, y, 640, 1, '#667f7c');
  for (let i = 0; i < 3; i++) {
    const x = laneX[i] - 50;
    panel(c, x - 4, 2, 108, 80, '#243d50', '#ebd5a1');
    portrait(c, i, x, 3);
  }
  const reaction = m.reaction;
  if (reaction) {
    const bx = laneX[reaction.lane] - 50;
    if (reaction.kind === 'flood') {
      const fill =
        reaction.phase === 'filling' ? Math.min(1, reaction.elapsed / reaction.duration) : 1;
      c.save();
      c.beginPath();
      c.rect(bx + 1, 4, 98, 59);
      c.clip();
      c.globalAlpha = 0.66;
      rect(c, bx, 63 - 15 * fill, 100, 15 * fill, '#f9dc32');
      c.globalAlpha = 1;
      for (let i = 0; i < 4; i++) {
        const yy = 48 - 15 * fill + ((i * 11 + reaction.elapsed * 18) % 15);
        rect(c, bx + 15 + i * 21, yy, 3, 2, '#fff4ae');
      }
      for (const ex of [43, 57]) {
        poly(c, [bx + ex, 28, bx + ex - 3, 36, bx + ex + 3, 36], '#95e6ff');
        rect(c, bx + ex - 2, 36, 4, 18, '#86cceaaa');
      }
      // Open sobbing mouth, pinched brows and pulsing tear jets.
      c.fillStyle = '#573047';
      c.beginPath();
      c.ellipse(
        bx + 50,
        40,
        5,
        3 + Math.abs(Math.sin(reaction.elapsed * 8)) * 2,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.strokeStyle = '#583749';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bx + 37, 24);
      c.lineTo(bx + 44, 22);
      c.moveTo(bx + 56, 22);
      c.lineTo(bx + 63, 24);
      c.stroke();
      c.restore();
      if (reaction.phase === 'overflow') {
        const sx = laneX[reaction.lane];
        c.save();
        c.beginPath();
        c.rect(0, 65, 640, m.umbrella && Math.abs(m.netX - sx) < catchWidth(m) + 12 ? 183 : 237);
        c.clip();
        poly(c, [sx - 16, 65, sx + 16, 65, sx + 9, 301, sx - 9, 301], '#f9d52dcc');
        for (let i = 0; i < 8; i++) {
          const y = 80 + ((i * 31 + reaction.elapsed * 100) % 214);
          rect(c, sx - 7 + (i % 3) * 5, y, 3, 10, '#fff0a3');
        }
        c.restore();
      }
    } else if (reaction.phase === 'angry') {
      c.save();
      c.globalAlpha = 0.48;
      poly(c, [bx + 32, 20, bx + 66, 20, bx + 65, 39, bx + 50, 47, bx + 33, 38], '#ff342f');
      c.restore();
      poly(c, [bx + 38, 24, bx + 46, 27, bx + 46, 29, bx + 38, 27], '#2b2431');
      poly(c, [bx + 54, 27, bx + 62, 24, bx + 62, 27, bx + 54, 29], '#2b2431');
      c.strokeStyle = '#502537';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bx + 42, 39);
      c.lineTo(bx + 49, 35);
      c.lineTo(bx + 58, 39);
      c.stroke();
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++) {
          c.fillStyle = '#edf1e7';
          c.beginPath();
          c.arc(bx + 50 + side * (26 + i * 7), 30 - i * 7, 4 + i, 0, Math.PI * 2);
          c.fill();
        }
    }
  }
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
      resource(c, target.type === 4 ? (target.promiseType ?? 0) : target.type, 0, 0);
      c.restore();
    } else {
      if (target.type === 4) {
        c.save();
        c.globalAlpha = 0.58;
        resource(c, target.promiseType ?? 0, x, y);
        c.restore();
        c.setLineDash([3, 2]);
        c.strokeStyle = '#f4e4af';
        c.strokeRect(x - 21, y - 23, 42, 44);
        c.setLineDash([]);
        label(c, 'PROMISE', x, y + 29, '#fff0bd', 8, true);
      } else resource(c, target.type, x, y);
    }
    if (target.warning > 0) {
      panel(c, x - 53, 101, 106, 17, '#18364a', '#8cacac');
      label(c, resourceNames[target.type].toUpperCase(), x, 113, '#fff0bc', 9, true);
    }
  }
  c.restore();
  // A faceted, scooped net projects forward beneath the exact catch line.
  const width = catchWidth(m),
    x = m.netX;
  shadow(c, x + 6, 335, width + 15, 7, 0.3);
  const netColor = m.catchTime > 0 ? '#a5e6c2' : m.cooldown > 0 ? '#6c8993' : '#69acaa';
  poly(c, [x - width, 302, x + width, 302, x + width - 9, 315, x - width + 9, 315], '#365e71');
  poly(
    c,
    [x - width + 9, 315, x + width - 9, 315, x + width - 20, 334, x - width + 20, 334],
    tone(netColor, -25),
  );
  poly(
    c,
    [x - width, 302, x - width + 9, 315, x - width + 20, 334, x - width + 10, 324],
    tone(netColor, 12),
  );
  poly(
    c,
    [x + width, 302, x + width - 9, 315, x + width - 20, 334, x + width - 10, 324],
    tone(netColor, -42),
  );
  for (let i = 0; i < 8; i++) {
    const ax = x - width + 12 + (i * (width * 2 - 24)) / 8,
      bx = x - width + 23 + (i * (width * 2 - 46)) / 8;
    poly(
      c,
      [ax, 309, ax + 2, 309, bx + 2, 331, bx, 331],
      config.variant === 'basket' ? '#d0ad7c' : '#b0d3c2',
    );
  }
  for (const y of [314, 321, 328]) {
    const inset = (y - 302) * 0.45;
    poly(
      c,
      [
        x - width + inset,
        y,
        x + width - inset,
        y,
        x + width - inset - 1,
        y + 2,
        x - width + inset + 1,
        y + 2,
      ],
      config.variant === 'basket' ? '#b29169' : '#7eb6ad',
    );
  }
  poly(
    c,
    [x - width - 2, 301, x + width + 2, 301, x + width - 2, 306, x - width + 2, 306],
    m.catchTime > 0 ? '#edfbd7' : '#c2d4be',
  );
  poly(
    c,
    [x - width + 2, 306, x + width - 2, 306, x + width - 2, 308, x - width + 2, 308],
    '#48788a',
  );
  if (config.variant === 'patchwork') {
    poly(c, [x - 15, 317, x, 317, x - 2, 330, x - 12, 330], '#d2a781');
    poly(c, [x - 15, 317, x, 317, x - 3, 320, x - 13, 320], '#eed1a0');
    poly(c, [x + 13, 315, x + 27, 315, x + 22, 327, x + 11, 327], '#729bb7');
  }
  for (const side of [-1, 1]) {
    const hx = x + side * (width + 5);
    poly(
      c,
      [hx - 4, 284, hx + 3, 283, hx + 6, 290, hx + 4, 304, hx - 4, 304, hx - 6, 291],
      '#b38c6c',
    );
    poly(c, [hx - 4, 285, hx + 1, 284, hx + 2, 301, hx - 4, 301], '#e4c29a');
    poly(c, [hx + 1, 284, hx + 4, 287, hx + 5, 296, hx + 2, 301], '#ccaa87');
    block(c, hx - 6, 301, 12, 13, 3, '#487a91');
    poly(c, [hx - 5, 301, hx + 5, 301, hx + 5, 305, hx - 5, 305], '#e2e4cb');
  }
  panel(c, 3, 342, 348, 66, '#1b3244', '#5b7883');
  for (let track = 0; track < 3; track++) {
    const bx = 12 + track * 112;
    c.save();
    c.translate(bx, 350);
    c.scale(0.48, 0.7);
    neighborhood(c, track, m.levels[track], 0, 0);
    c.restore();
    label(c, ['EDUCATION', 'CARE', 'HOMES'][track], bx + 46, 360, '#dbe7cf', 8);
    label(c, `${m.levels[track]}/2`, bx + 55, 376, '#b4cec8', 10);
    rect(c, bx + 46, 384, 58, 4, '#142c39');
    rect(c, bx + 46, 384, m.levels[track] * 29, 4, '#84c6a3');
  }
  panel(c, 357, 342, 279, 66, '#18313d', '#b9a879');
  label(c, 'TRICKLE-DOWN TYCOON', 367, 352, '#e8d5a4', 8);
  label(c, `ROUND ${m.round}/5   SCORE ${m.score}`, 367, 363, '#e8d5a4', 9);
  label(c, `NET ${'♥'.repeat(m.integrity)}  AUDIT ${m.audits}`, 367, 375, '#b8ddd0', 8);
  label(
    c,
    `BONUS +${Math.round(m.bonusPercent)}%  STORED ${m.storedPromises.length}`,
    367,
    385,
    '#d6edb2',
    9,
  );
  label(
    c,
    `WET ${m.wetSeconds.toFixed(1)}s  SPEED ${m.speedMult.toFixed(2)}x`,
    367,
    400,
    '#95d7ec',
    9,
  );
  if (m.freeze > 0) {
    c.strokeStyle = '#a0e8db';
    c.lineWidth = 3;
    c.strokeRect(5, 98, 630, 237);
    c.lineWidth = 1;
    label(c, 'PUBLIC AUDIT · READ THE FINE PRINT', 320, 272, '#e3f7d6', 10, true);
  }
  if (m.umbrella) {
    poly(
      c,
      [x - width - 12, 280, x - width + 4, 258, x, 248, x + width - 4, 258, x + width + 12, 280],
      '#6396c0',
    );
    poly(c, [x, 248, x - 15, 280, x + 15, 280], '#bfdfca');
    c.strokeStyle = '#e2e7ce';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, 250);
    c.lineTo(x, 299);
    c.stroke();
    label(c, 'UMBRELLA', x, 243, '#e5f8dd', 8, true);
  }
  if (
    reaction &&
    (reaction.phase === 'filling' || reaction.phase === 'angry') &&
    reaction.elapsed < 0.5
  ) {
    const t = Math.min(1, reaction.elapsed / 0.5);
    c.save();
    c.translate(m.netX + (laneX[reaction.lane] - m.netX) * t, 300 - 250 * t);
    c.rotate(Math.sin(t * Math.PI) * 0.5);
    c.scale(1 - t * 0.4, 1 - t * 0.4);
    resource(c, reaction.type, 0, 0);
    c.restore();
  }
  if (reaction?.phase === 'overflow')
    label(
      c,
      `MOUNTAIN DEW · ${Math.ceil(reaction.duration - reaction.elapsed)}s`,
      laneX[reaction.lane],
      128,
      '#fff0a3',
      9,
      true,
    );
  if (reaction?.kind === 'capitulation' && (reaction.phase !== 'angry' || reaction.elapsed > 0.7)) {
    const entry = reaction.phase === 'angry' ? Math.min(1, (reaction.elapsed - 0.7) / 0.3) : 1;
    const progress =
      reaction.phase === 'flying' ? Math.min(1, reaction.elapsed / reaction.duration) : 0;
    if (!progress) {
      c.save();
      c.beginPath();
      c.rect(8, 84, 624, 251);
      c.clip();
      rect(c, 8, 84, 624, 251, '#10283bed');
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 12;
        c.strokeStyle = i % 2 ? '#b6c6ba55' : '#f3dab65a';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(320 + Math.cos(angle) * 100, 206 + Math.sin(angle) * 48);
        c.lineTo(320 + Math.cos(angle) * 330, 206 + Math.sin(angle) * 180);
        c.stroke();
      }
      c.restore();
    }
    c.save();
    c.translate(320 + (x - 320) * progress, 201 + 100 * progress);
    const size = (1 + 4.3 * entry) * (1 - progress) + progress;
    c.scale(size, size);
    resource(c, reaction.type, 0, 0);
    c.restore();
    if (!progress && entry === 1)
      label(c, 'CAPITULATION NOT HOLLOW PROMISE', 320, 319, '#fff0b2', 16, true);
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
        ? 'Catch resources. Return promises with Q. Umbrella: U.'
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
