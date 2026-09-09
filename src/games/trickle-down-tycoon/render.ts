import { textureFace, textureRect } from '../../shared/fidelity/materials';
import type { TycoonConfig } from './config';
import { catchWidth, laneX, resourceNames, type TycoonModel } from './model';
const images = new Map<string, HTMLImageElement>();
function asset(name: string) {
  let img = images.get(name);
  if (!img && typeof Image !== 'undefined') {
    img = new Image();
    img.src = `/assets/fidelity/${name}.png`;
    images.set(name, img);
  }
  return img?.complete && img.naturalWidth ? img : null;
}
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
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const fade = c.createRadialGradient(0, 0, 0.1, 0, 0, 1);
  fade.addColorStop(0, `rgba(3,12,22,${alpha})`);
  fade.addColorStop(0.5, `rgba(3,12,22,${alpha * 0.55})`);
  fade.addColorStop(1, 'rgba(3,12,22,0)');
  c.fillStyle = fade;
  c.beginPath();
  c.arc(0, 0, 1, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
function volume(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  rotation = 0,
) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  const light = c.createRadialGradient(-rx * 0.35, -ry * 0.4, 1, 0, 0, Math.max(rx, ry));
  light.addColorStop(0, tone(color, 16));
  light.addColorStop(0.58, color);
  light.addColorStop(1, tone(color, -24));
  c.fillStyle = light;
  c.beginPath();
  c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
export function portrait(
  c: CanvasRenderingContext2D,
  person: number,
  x: number,
  y: number,
  time = 0,
  reducedMotion = false,
  mood = 'idle',
) {
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
  c.save();
  const breathe = reducedMotion ? 0 : Math.sin(time * 1.7 + person) * 0.45;
  c.translate(0, breathe);
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
  // Sculpted volumes, shaded cheeks and small anatomical features at booth scale.
  volume(c, 49, 25, 19, 22, skin, -0.04);
  volume(c, 31, 26, 3.4, 6.3, tone(skin, -10));
  volume(c, 68, 26, 3.3, 6.1, tone(skin, -21));
  volume(c, 40, 29, 9, 9, tone(skin, 5));
  volume(c, 58, 30, 8, 9, tone(skin, -8));
  volume(c, 50, 39, 10, 6, tone(skin, -12));
  for (const ex of [41, 58]) {
    volume(c, ex, 23, 6, 3, tone(skin, -29));
    volume(c, ex, 23, 4.8, 1.7, '#d8d5c9');
    volume(c, ex + 0.4, 23, 1.35, 1.5, '#5a6f78');
    rect(c, ex + 0.1, 22.4, 0.8, 1.7, '#1f2d31');
    rect(c, ex - 0.3, 22.1, 0.6, 0.6, '#f0ebd9');
    c.strokeStyle = tone(skin, -42);
    c.lineWidth = 0.65;
    c.beginPath();
    c.moveTo(ex - 5, 20);
    c.quadraticCurveTo(ex, 18.7, ex + 5, 20.5);
    c.stroke();
    c.strokeStyle = tone(skin, -22);
    c.beginPath();
    c.moveTo(ex - 4, 26);
    c.quadraticCurveTo(ex, 28, ex + 4, 26.5);
    c.stroke();
  }
  volume(c, 49, 28, 3.1, 7.2, tone(skin, 2), -0.08);
  volume(c, 49.5, 32, 4, 2.2, tone(skin, -4));
  c.strokeStyle = tone(skin, -58);
  c.lineWidth = 0.65;
  c.beginPath();
  c.moveTo(45.5, 32.5);
  c.quadraticCurveTo(47, 34, 48, 32.9);
  c.moveTo(51, 33);
  c.lineTo(53, 32);
  c.stroke();
  volume(c, 49.5, 37.1, 6.7, 1.55, '#9d6d60');
  c.strokeStyle = '#69453d';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(43, 37);
  c.quadraticCurveTo(49.5, 38, 56, 36.6);
  c.stroke();
  c.strokeStyle = tone(skin, -27);
  c.lineWidth = 0.45;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(38 + i, 13 + i * 2);
    c.quadraticCurveTo(48, 11 + i * 2, 60 - i, 14 + i * 2);
    c.stroke();
  }
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(49 + side * 6, 30);
    c.quadraticCurveTo(49 + side * 10, 34, 49 + side * 9, 38);
    c.stroke();
  }
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
  const heads = asset('political-heads');
  if (heads) {
    c.save();
    c.beginPath();
    const tilt = reducedMotion ? 0 : Math.sin(time * 0.75 + person) * 0.015;
    c.translate(49, 28);
    c.rotate(tilt);
    c.translate(-49, -28);
    c.moveTo(29, 16);
    c.bezierCurveTo(27, -1, 69, -3, 70, 15);
    c.lineTo(69, 32);
    c.bezierCurveTo(66, 46, 56, 49, 48, 48);
    c.bezierCurveTo(34, 47, 28, 39, 29, 16);
    c.closePath();
    c.clip();
    const cell = heads.naturalWidth / 4;
    c.drawImage(heads, person * cell + 42, 18, cell - 80, 407, 26, 1, 48, 49);
    c.restore();
  }
  if (!reducedMotion && (time + person * 0.9) % 4.4 < 0.13) {
    for (const ex of [41, 57]) {
      c.fillStyle = tone(skin, -4);
      c.beginPath();
      c.ellipse(ex, 23, 5.1, 1.6, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#674c42';
      c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(ex - 4, 23);
      c.quadraticCurveTo(ex, 24.2, ex + 4, 23);
      c.stroke();
    }
  }
  for (const side of [-1, 1]) {
    const high = mood === 'angry' ? 40 : mood === 'filling' || mood === 'overflow' ? 31 : 58;
    const handX = 49 + side * (mood === 'idle' ? 27 : 22);
    c.strokeStyle = jacket;
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(49 + side * 23, 52);
    c.lineTo(handX, high + 5);
    c.stroke();
    volume(c, handX, high, 3.4, 4.6, skin, side * 0.2);
    if (mood === 'idle')
      for (let finger = 0; finger < 3; finger++)
        volume(c, handX - 2 + finger * 2, high + 2, 1, 2, skin);
  }
  textureFace(
    c,
    [
      { x: 19, y: 48 },
      { x: 34, y: 43 },
      { x: 43, y: 64 },
      { x: 16, y: 64 },
    ],
    'wool',
    0.25,
  );
  textureFace(
    c,
    [
      { x: 62, y: 43 },
      { x: 78, y: 48 },
      { x: 85, y: 64 },
      { x: 57, y: 64 },
    ],
    'wool',
    0.25,
  );
  c.strokeStyle = '#aab6bd66';
  c.lineWidth = 0.55;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(49 + side * 20, 48);
    c.lineTo(49 + side * 14, 57);
    c.lineTo(49 + side * 18, 63);
    c.stroke();
  }
  c.restore();
  poly(c, [0, 62, 100, 62, 96, 76, 4, 76], '#132a3d');
  poly(c, [0, 62, 100, 62, 97, 64, 3, 64], '#a79c78');
  label(c, ['DONALD TRUMP', 'JD VANCE', 'MIKE JOHNSON'][person], 50, 73, '#efe1ba', 9, true);
  c.restore();
}

function resource(c: CanvasRenderingContext2D, type: number, x: number, y: number) {
  c.save();
  c.translate(x, y);
  if (type === 0) {
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
  if (type === 0) {
    textureFace(
      c,
      [
        { x: -8, y: -6 },
        { x: 7, y: -9 },
        { x: 8, y: 11 },
        { x: -7, y: 14 },
      ],
      'leather',
      0.35,
    );
    c.strokeStyle = '#d9c6a5';
    c.lineWidth = 0.45;
    for (let line = 0; line < 7; line++) {
      c.beginPath();
      c.moveTo(10, -5 + line * 2.3);
      c.lineTo(13, -3 + line * 2.2);
      c.stroke();
    }
  } else if (type === 1) {
    textureFace(
      c,
      [
        { x: -15, y: -9 },
        { x: 10, y: -9 },
        { x: 10, y: 14 },
        { x: -15, y: 14 },
      ],
      'canvas',
      0.18,
    );
    c.strokeStyle = '#d4dccc';
    c.lineWidth = 0.6;
    c.strokeRect(-12, -6, 19, 17);
    c.strokeStyle = '#345e67';
    c.lineWidth = 0.6;
    c.setLineDash([1, 1]);
    c.strokeRect(-13, -7, 21, 19);
    c.setLineDash([]);
    volume(c, -11, 10, 1.2, 1.2, '#cad2bb');
    volume(c, 7, 10, 1.2, 1.2, '#cad2bb');
  } else if (type === 2) {
    c.strokeStyle = '#fff0bd';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(-12, -9);
    c.quadraticCurveTo(-4, -17, 3, -9);
    c.stroke();
    textureFace(
      c,
      [
        { x: -2, y: 3 },
        { x: 3, y: 3 },
        { x: 13, y: 14 },
        { x: 9, y: 17 },
      ],
      'steel',
      0.14,
    );
  } else if (type === 3) {
    c.strokeStyle = '#fff0b4';
    c.lineWidth = 0.6;
    c.beginPath();
    c.arc(0, 0, 14, Math.PI, Math.PI * 1.7);
    c.stroke();
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
export function render(
  c: CanvasRenderingContext2D,
  m: TycoonModel,
  config: TycoonConfig,
  reducedMotion = false,
) {
  c.save();
  c.lineWidth = 1;
  c.textAlign = 'left';
  c.setLineDash([]);
  rect(c, 0, 0, 640, 410, '#112438');
  const facade = asset('whitehouse');
  if (!facade) {
    const sky = c.createLinearGradient(0, 0, 0, 340);
    sky.addColorStop(0, '#506c91');
    sky.addColorStop(1, '#cfdbca');
    c.fillStyle = sky;
    c.fillRect(0, 0, 640, 342);
    // Symmetric pale mansion, columned portico and recessed sash windows.
    block(c, 24, 80, 580, 202, 8, '#d4d8ca');
    for (let y = 80; y < 282; y += 50)
      for (let x = 24; x < 604; x += 58)
        textureRect(c, x, y, 58, Math.min(50, 282 - y), 'limestone', 0.25);
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
    for (let row = 0; row < 3; row++)
      for (let col = -1; col < 11; col++) {
        const top = 279 + row * 21,
          bottom = top + 21;
        const a = 320 + (col * 64 - 320) * (0.65 + row * 0.12),
          b = 320 + ((col + 1) * 64 - 320) * (0.65 + row * 0.12);
        const cc = 320 + (col * 64 - 320) * (0.65 + (row + 1) * 0.12),
          d = 320 + ((col + 1) * 64 - 320) * (0.65 + (row + 1) * 0.12);
        textureFace(
          c,
          [
            { x: a, y: top },
            { x: b, y: top },
            { x: d, y: bottom },
            { x: cc, y: bottom },
          ],
          'asphalt',
          0.15,
        );
      }

    for (let k = -2; k < 9; k++) {
      c.strokeStyle = '#d6dfc355';
      c.beginPath();
      c.moveTo(320 + (k * 96 - 320) * 0.5, 280);
      c.lineTo(k * 96, 342);
      c.stroke();
    }
    for (const y of [292, 313, 339]) rect(c, 0, y, 640, 1, '#667f7c');
  }
  if (facade) {
    c.save();
    c.beginPath();
    c.rect(0, 0, 640, 342);
    c.clip();
    const scale = 640 / facade.naturalWidth,
      height = facade.naturalHeight * scale;
    c.drawImage(facade, 0, 342 - height, 640, height);
    const tint = c.createLinearGradient(0, 80, 0, 342);
    tint.addColorStop(0, '#13243210');
    tint.addColorStop(1, '#08131d25');
    c.fillStyle = tint;
    c.fillRect(0, 0, 640, 342);
    c.restore();
  }
  if (facade) {
    c.save();
    c.beginPath();
    c.rect(0, 83, 640, 259);
    c.clip();
    const weatherTime = reducedMotion ? 0 : m.time;
    c.strokeStyle = '#d1dce524';
    c.lineWidth = 0.6;
    for (let i = 0; i < 34; i++) {
      const rx = (i * 137 + 17) % 640,
        ry = 83 + ((i * 53 + weatherTime * 115) % 259);
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx - 1.5, ry + 5);
      c.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const phase = (weatherTime * 0.8 + i * 0.137) % 1;
      c.strokeStyle = `rgba(203,222,226,${(1 - phase) * 0.1})`;
      c.beginPath();
      c.ellipse(
        20 + ((i * 71) % 610),
        292 + ((i * 17) % 45),
        1 + phase * 4,
        0.5 + phase * 1.3,
        0,
        0,
        Math.PI * 2,
      );
      c.stroke();
    }
    c.restore();
  }
  for (let i = 0; i < 3; i++) {
    const x = laneX[i] - 50;
    panel(c, x - 4, 2, 108, 80, '#243d50', '#ebd5a1');
    portrait(c, i, x, 3, m.time, reducedMotion, m.reaction?.lane === i ? m.reaction.phase : 'idle');
  }
  const reaction = m.reaction;
  if (reaction) {
    const effectTime = reducedMotion ? 0 : reaction.elapsed;
    const bx = laneX[reaction.lane] - 50;
    if (reaction.kind === 'flood') {
      const fill =
        reaction.phase === 'filling' ? Math.min(1, reaction.elapsed / reaction.duration) : 1;
      c.save();
      c.beginPath();
      c.rect(bx + 1, 4, 98, 59);
      c.clip();
      c.globalAlpha = 0.66;
      const liquid = c.createLinearGradient(0, 48, 0, 64);
      liquid.addColorStop(0, '#ffed74');
      liquid.addColorStop(0.3, '#e9c824');
      liquid.addColorStop(1, '#b59b17');
      c.fillStyle = liquid;
      c.fillRect(bx, 63 - 15 * fill, 100, 15 * fill);
      c.strokeStyle = '#fff7bd';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(bx, 63 - 15 * fill);
      c.bezierCurveTo(bx + 30, 61 - 15 * fill, bx + 70, 65 - 15 * fill, bx + 100, 63 - 15 * fill);
      c.stroke();
      c.globalAlpha = 1;
      for (let i = 0; i < 4; i++) {
        const yy = 48 - 15 * fill + ((i * 11 + effectTime * 18) % 15);
        rect(c, bx + 15 + i * 21, yy, 3, 2, '#fff4ae');
      }
      for (const ex of [43, 57]) {
        poly(c, [bx + ex, 28, bx + ex - 3, 36, bx + ex + 3, 36], '#95e6ff');
        c.strokeStyle = '#b4eaf0aa';
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(bx + ex, 33);
        c.bezierCurveTo(bx + ex - 2, 41, bx + ex + 2, 48, bx + ex, 54);
        c.stroke();
        c.strokeStyle = '#f1fdf277';
        c.lineWidth = 0.6;
        c.stroke();
      }
      // Open sobbing mouth, pinched brows and pulsing tear jets.
      c.fillStyle = '#573047';
      c.beginPath();
      c.ellipse(bx + 50, 40, 5, 3 + Math.abs(Math.sin(effectTime * 8)) * 2, 0, 0, Math.PI * 2);
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
        const flow = c.createLinearGradient(sx - 16, 0, sx + 16, 0);
        flow.addColorStop(0, '#f6cd2433');
        flow.addColorStop(0.3, '#f9d52ddd');
        flow.addColorStop(0.54, '#fff196dd');
        flow.addColorStop(0.8, '#dfb91bcc');
        flow.addColorStop(1, '#f6cd2422');
        c.fillStyle = flow;
        c.beginPath();
        c.moveTo(sx - 16, 65);
        c.bezierCurveTo(sx - 6, 120, sx - 12, 210, sx - 9, 301);
        c.lineTo(sx + 9, 301);
        c.bezierCurveTo(sx + 13, 225, sx + 6, 150, sx + 16, 65);
        c.closePath();
        c.fill();
        for (let i = 0; i < 8; i++) {
          const y = 80 + ((i * 31 + effectTime * 100) % 214);
          rect(c, sx - 7 + (i % 3) * 5, y, 3, 10, '#fff0a3');
        }
        c.restore();
        const protectedNet = m.umbrella && Math.abs(m.netX - sx) < catchWidth(m) + 12;
        const splashY = protectedNet ? 279 : 303;
        for (let i = 0; i < 9; i++) {
          const phase = (effectTime * 2 + i * 0.137) % 1,
            side = i % 2 ? 1 : -1;
          volume(
            c,
            (protectedNet ? m.netX : sx) + side * (12 + phase * 24),
            splashY - phase * (1 - phase) * 28,
            0.8,
            1.7,
            '#e6cc53',
          );
        }
      }
    } else if (reaction.phase === 'angry') {
      c.save();
      c.globalAlpha = 0.48;
      const flush = c.createRadialGradient(bx + 49, 31, 2, bx + 49, 29, 21);
      flush.addColorStop(0, '#e8382ecc');
      flush.addColorStop(0.65, '#cb413eaa');
      flush.addColorStop(1, '#ce554400');
      c.fillStyle = flush;
      c.beginPath();
      c.ellipse(bx + 49, 29, 19, 20, 0, 0, Math.PI * 2);
      c.fill();
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
      for (const side of [-1, 1]) {
        c.strokeStyle = '#e6efdeaa';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(bx + 49 + side * 22, 28);
        c.bezierCurveTo(bx + 49 + side * 42, 30, bx + 49 + side * 26, 15, bx + 49 + side * 43, 11);
        c.stroke();
        for (let i = 0; i < 3; i++) {
          const px = bx + 49 + side * (27 + i * 7),
            py = 25 - i * 6;
          const mist = c.createRadialGradient(px, py, 0, px, py, 5 + i);
          mist.addColorStop(0, '#f5f4e8bb');
          mist.addColorStop(1, '#f5f4e800');
          c.fillStyle = mist;
          c.fillRect(px - 8, py - 8, 16, 16);
        }
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
    const approach = Math.max(0, Math.min(1, (y - 90) / 210));
    shadow(c, x, 334, 5 + approach * 13, 1 + approach * 3, 0.05 + approach * 0.2);
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
  if (m.catchTime > 0) {
    const glow = c.createRadialGradient(m.netX, 321, 3, m.netX, 321, catchWidth(m) + 18);
    glow.addColorStop(0, '#b5e5b633');
    glow.addColorStop(1, '#b5e5b600');
    c.fillStyle = glow;
    c.fillRect(m.netX - catchWidth(m) - 18, 285, catchWidth(m) * 2 + 36, 56);
  }
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
  textureFace(
    c,
    [
      { x: x - width + 9, y: 315 },
      { x: x + width - 9, y: 315 },
      { x: x + width - 20, y: 334 },
      { x: x - width + 20, y: 334 },
    ],
    config.variant === 'basket' ? 'wood' : 'mesh',
    0.24,
  );
  for (const side of [-1, 1]) {
    const hx = x + side * (width + 5);
    volume(c, hx, 296, 6.5, 10, '#bf9977', side * 0.16);
    for (let finger = 0; finger < 4; finger++) {
      const fx = hx - 4 + finger * 2.5;
      volume(c, fx, 291 + Math.abs(finger - 1.5), 1.55, 6.2, '#cda987', side * 0.12);
      volume(c, fx, 287 + Math.abs(finger - 1.5), 1.1, 1.5, '#e0c4a6');
      c.strokeStyle = '#96755c';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(fx - 1, 292);
      c.lineTo(fx + 1, 292.5);
      c.stroke();
    }
    volume(c, hx - side * 5.5, 297, 3, 6, '#c7a07c', side * 0.5);
    block(c, hx - 6, 303, 12, 12, 2, '#4e7181');
    textureRect(c, hx - 5, 305, 10, 9, 'denim', 0.3);
    poly(c, [hx - 6, 302, hx + 6, 302, hx + 6, 306, hx - 6, 306], '#d7d6be');
  }
  panel(c, 3, 342, 348, 66, '#1b3244', '#5b7883');
  for (let track = 0; track < 3; track++) {
    const bx = 12 + track * 112;
    c.save();
    c.translate(bx, 350);
    c.scale(0.48, 0.7);
    neighborhood(c, track, m.levels[track], 0, 0);
    c.restore();
    label(c, ['EDUCATION', 'CARE', 'HOMES'][track], bx + 44, 360, '#dbe7cf', 9);
    label(c, `${m.levels[track]}/2`, bx + 55, 376, '#b4cec8', 10);
    rect(c, bx + 46, 384, 58, 4, '#142c39');
    rect(c, bx + 46, 384, m.levels[track] * 29, 4, '#84c6a3');
  }
  panel(c, 357, 342, 279, 66, '#18313d', '#b9a879');

  label(c, `ROUND ${m.round}/5   SCORE ${m.score}`, 367, 358, '#f1e3be', 11);
  label(c, `NET ${'♥'.repeat(m.integrity)}  AUDIT ${m.audits}`, 367, 373, '#cbeade', 10);
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
    c.save();
    c.beginPath();
    c.moveTo(x - width - 12, 280);
    c.bezierCurveTo(x - width, 256, x - 24, 248, x, 248);
    c.bezierCurveTo(x + 24, 248, x + width, 256, x + width + 12, 280);
    c.quadraticCurveTo(x + width * 0.5, 273, x, 280);
    c.quadraticCurveTo(x - width * 0.5, 273, x - width - 12, 280);
    c.closePath();
    const canopy = c.createLinearGradient(x - width, 250, x + width, 285);
    canopy.addColorStop(0, '#83a7b6');
    canopy.addColorStop(0.5, '#506e83');
    canopy.addColorStop(1, '#243f55');
    c.fillStyle = canopy;
    c.fill();
    c.clip();
    textureRect(c, x - width - 12, 248, width * 2 + 24, 34, 'canvas', 0.3);
    c.restore();
    c.strokeStyle = '#b8cacc';
    c.lineWidth = 0.65;
    for (let rib = -2; rib <= 2; rib++) {
      c.beginPath();
      c.moveTo(x, 249);
      c.quadraticCurveTo(x + rib * width * 0.22, 256, x + rib * width * 0.48, 279);
      c.stroke();
    }
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
