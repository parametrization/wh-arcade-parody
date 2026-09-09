import { textureRect } from '../../shared/fidelity/materials';
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
  shadow(c, x + w * 0.5, y + h + 2, w * 0.48, 4, 0.28);
  const surface = c.createLinearGradient(x, y, x, y + h);
  surface.addColorStop(0, base);
  surface.addColorStop(1, dark);
  c.fillStyle = surface;
  c.beginPath();
  c.roundRect(x, y, w, h, 3);
  c.fill();
  c.strokeStyle = light + '88';
  c.lineWidth = 0.7;
  c.stroke();
  c.strokeStyle = '#ffffff15';
  c.beginPath();
  c.moveTo(x + 4, y + 2);
  c.lineTo(x + w - 4, y + 2);
  c.stroke();
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
  c.font = `600 ${size}px Arial, sans-serif`;
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
let castImage: HTMLImageElement | undefined;
function photographicHead(c: CanvasRenderingContext2D, person: number) {
  if (!castImage && typeof Image !== 'undefined') {
    castImage = new Image();
    castImage.src = '/assets/fidelity/political-heads.png';
  }
  if (!castImage?.complete || !castImage.naturalWidth) return;
  c.save();
  c.beginPath();
  c.moveTo(35, 7);
  c.bezierCurveTo(42, 1, 57, 1, 64, 8);
  c.bezierCurveTo(68, 17, 68, 31, 62, 41);
  c.bezierCurveTo(58, 50, 41, 50, 36, 41);
  c.bezierCurveTo(30, 30, 30, 17, 35, 7);
  c.closePath();
  c.clip();
  const cell = castImage.naturalWidth / 4;
  c.drawImage(
    castImage,
    person * cell + cell * 0.18,
    cell * 0.03,
    cell * 0.64,
    cell * 0.94,
    27,
    0,
    45,
    54,
  );
  c.restore();
}
export function portrait(
  c: CanvasRenderingContext2D,
  person: number,
  x: number,
  y: number,
  time = 0,
) {
  c.save();
  c.translate(x, y);
  const bg = c.createLinearGradient(0, 0, 100, 76);
  bg.addColorStop(0, '#63717a');
  bg.addColorStop(1, '#14212c');
  c.fillStyle = bg;
  c.fillRect(0, 0, 100, 76);
  textureRect(c, 0, 0, 100, 64, 'plaster', 0.13);
  const ellipse = (x: number, y: number, rx: number, ry: number, color: string) => {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  };
  const curve = (points: number[], fill: string | CanvasGradient) => {
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 6)
      c.bezierCurveTo(
        ...(points.slice(i, i + 6) as [number, number, number, number, number, number]),
      );
    c.closePath();
    c.fill();
  };
  shadow(c, 50, 62, 35, 7, 0.4);
  const jacket = c.createLinearGradient(20, 40, 82, 65);
  jacket.addColorStop(0, '#506b82');
  jacket.addColorStop(0.45, '#273d51');
  jacket.addColorStop(1, '#111e2c');
  curve(
    [
      15, 64, 18, 48, 25, 45, 38, 42, 43, 39, 57, 39, 63, 42, 78, 45, 83, 50, 86, 64, 65, 68, 34,
      68, 15, 64,
    ],
    jacket,
  );
  textureRect(c, 25, 48, 47, 15, 'wool', 0.12);
  poly(c, [38, 42, 49, 48, 61, 42, 55, 64, 43, 64], '#d9d9cd');
  poly(c, [48, 48, 52, 48, 54, 53, 51, 56, 54, 65, 47, 65, 48, 56, 46, 53], '#873544');
  c.strokeStyle = '#8292a04d';
  c.lineWidth = 0.7;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(49 + side * 10, 43);
    c.lineTo(49 + side * 17, 50);
    c.lineTo(49 + side * 7, 60);
    c.stroke();
  }
  const skin = ['#d9a078', '#cbaa90', '#d5b395'][person];
  ellipse(50, 43, 7, 7, '#a77b60');
  ellipse(31, 28, 4, 7, skin);
  ellipse(68, 28, 3, 7, '#ab7f66');
  const flesh = c.createRadialGradient(43, 21, 3, 53, 28, 26);
  flesh.addColorStop(0, '#f1c7a1');
  flesh.addColorStop(0.55, skin);
  flesh.addColorStop(1, '#8d624d');
  curve([31, 19, 31, 6, 64, 4, 67, 18, 71, 30, 65, 42, 53, 45, 42, 47, 31, 39, 31, 19], flesh);
  // Rounded cheeks, brow ridge, lower lids and asymmetry keep features organic.
  ellipse(39, 29, 6, 4, '#d69b7b35');
  ellipse(60, 29, 5, 4, '#99685122');
  const blink = Math.sin(time * 0.7 + person) > 0.995;
  for (const side of [-1, 1]) {
    const xx = 50 + side * 9;
    ellipse(xx, 24, 4.2, blink ? 0.5 : 1.6, '#eee1cc');
    ellipse(xx + 0.4, 24, 1.3, blink ? 0.35 : 1.4, '#42505a');
    ellipse(xx + 0.6, 24, 0.65, blink ? 0.3 : 1.1, '#252626');
    c.strokeStyle = '#825f494f';
    c.lineWidth = 0.7;
    c.beginPath();
    c.ellipse(xx, 25, 4.8, 2, 0, 0, Math.PI);
    c.stroke();
    c.strokeStyle = person === 0 ? '#9c774b' : '#584438';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(xx - 4, 21);
    c.quadraticCurveTo(xx, 19.5, xx + 4, 21);
    c.stroke();
  }
  const nose = c.createLinearGradient(46, 25, 54, 32);
  nose.addColorStop(0, '#aa765c');
  nose.addColorStop(0.5, '#efc39c');
  nose.addColorStop(1, '#b38162');
  curve([49, 23, 47, 26, 47, 29, 46, 31, 49, 34, 53, 33, 55, 31, 52, 30, 52, 26, 49, 23], nose);
  c.strokeStyle = '#99634f';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(42, 36);
  c.quadraticCurveTo(50, 38, 58, 35);
  c.stroke();
  c.strokeStyle = '#f4ccab77';
  c.beginPath();
  c.moveTo(45, 39);
  c.quadraticCurveTo(51, 40, 56, 38);
  c.stroke();
  if (person === 0) {
    curve(
      [
        30, 22, 27, 16, 27, 10, 33, 7, 44, 1, 59, 4, 66, 8, 77, 17, 57, 16, 51, 13, 42, 12, 38, 17,
        30, 22,
      ],
      '#c5a261',
    );
    c.strokeStyle = '#f0d49a';
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(31 + i, 12 + i * 0.6);
      c.bezierCurveTo(41, 4 + i, 54, 6 + i, 64, 10 + i * 0.4);
      c.stroke();
    }
  } else {
    curve(
      [
        31, 24, 25, 17, 32, 7, 41, 5, 53, 0, 67, 8, 67, 20, 60, 18, 59, 11, 51, 12, 41, 11, 35, 17,
        31, 24,
      ],
      person === 1 ? '#49372c' : '#5c4837',
    );
    c.strokeStyle = '#9e806033';
    for (let i = 0; i < 7; i++) {
      c.beginPath();
      c.moveTo(32 + i * 2, 13);
      c.quadraticCurveTo(47, 5 + i, 63, 13 + i * 0.2);
      c.stroke();
    }
  }
  if (person === 1) {
    curve(
      [
        33, 29, 38, 33, 40, 33, 43, 32, 48, 35, 54, 35, 60, 31, 65, 27, 66, 33, 60, 41, 52, 48, 37,
        42, 33, 29,
      ],
      '#604736',
    );
    c.strokeStyle = '#ba977353';
    c.lineWidth = 0.5;
    for (let i = 0; i < 15; i++) {
      c.beginPath();
      c.moveTo(35 + i * 1.8, 35 + (i % 3));
      c.lineTo(37 + i * 1.7, 39 + (i % 3));
      c.stroke();
    }
    ellipse(50, 36, 5, 1, '#c69174');
  }
  if (person === 2) {
    c.strokeStyle = '#36393b';
    c.lineWidth = 1.25;
    for (const xx of [36, 52]) {
      c.beginPath();
      c.roundRect(xx, 21, 12, 8, 2);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(48, 23);
    c.lineTo(52, 23);
    c.stroke();
  }
  photographicHead(c, person);
  poly(c, [0, 62, 100, 62, 100, 76, 0, 76], '#17232f');
  label(c, ['DONALD TRUMP', 'JD VANCE', 'MIKE JOHNSON'][person], 50, 73, '#e7dcc5', 9, true);
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
function building(c: CanvasRenderingContext2D, d: number, x: number, y: number, time = 0) {
  shadow(c, x + 29, y + 37, 29, 4, 0.28);
  block(c, x + 2, y + 7, 44, 30, 5, ['#968f78', '#a2aaa0', '#aaa08b'][d]);
  textureRect(c, x + 3, y + 9, 42, 27, 'plaster', 0.45);
  rect(c, x + 6, y + 13, 32, 22, '#273238');
  const interior = c.createLinearGradient(x, y + 14, x, y + 36);
  interior.addColorStop(0, '#142126');
  interior.addColorStop(1, '#625e4f');
  c.fillStyle = interior;
  c.fillRect(x + 8, y + 15, 28, 20);
  for (let row = 0; row < 3; row++) {
    rect(c, x + 9, y + 20 + row * 5, 25, 1, '#a89d7a');
    for (let n = 0; n < 4; n++) {
      rect(c, x + 10 + n * 6, y + 16 + row * 5, 4, 4, ['#b8a77f', '#c7cbc0', '#9d8a62'][d]);
    }
  }
  rect(c, x + 2, y + 6, 45, 4, '#424e4a');
  textureRect(c, x + 2, y + 6, 45, 4, 'steel', 0.26);
  rect(c, x + 5, y + 36, 40, 2, '#c0b89c');
  // Proportioned receiving worker: feet contact the loading apron, elbows articulate.
  const px = x + 53,
    py = y + 35,
    bob = Math.sin(time * 1.3 + d) * 0.35;
  shadow(c, px, py + 2, 7, 2, 0.35);
  const limb = (a: number, b: number, e: number, f: number, width: number, color: string) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(a, b);
    c.lineTo(e, f);
    c.stroke();
  };
  limb(px - 2, py - 11, px - 3, py, 3, '#3c4548');
  limb(px + 2, py - 11, px + 3, py, 3, '#343b40');
  limb(px - 3, py, px - 1, py + 1, 2.5, '#292b28');
  limb(px + 3, py, px + 5, py + 1, 2.5, '#292b28');
  c.fillStyle = ['#a48b63', '#bfc3b6', '#758c81'][d];
  c.beginPath();
  c.roundRect(px - 4, py - 22 + bob, 8, 13, 3);
  c.fill();
  limb(px - 4, py - 20, px - 6, py - 15, 2.5, '#8b806a');
  limb(px - 6, py - 15, px - 3, py - 13 + bob, 2, '#bc9270');
  limb(px + 4, py - 20, px + 6, py - 16, 2.5, '#8b806a');
  limb(px + 6, py - 16, px + 3, py - 13 + bob, 2, '#bc9270');
  c.fillStyle = '#c29b7b';
  c.beginPath();
  c.ellipse(px, py - 26 + bob, 3.5, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#4a3e32';
  c.beginPath();
  c.ellipse(px, py - 28 + bob, 3.7, 2.6, 0, Math.PI, Math.PI * 2);
  c.fill();
  // Receiving staff wear different practical layers, with cloth seams and visible hands.
  textureRect(c, px - 3, py - 21 + bob, 6, 10, d === 1 ? 'canvas' : 'denim', 0.24);
  c.strokeStyle = d === 1 ? '#e5e2c6' : '#a0a899';
  c.lineWidth = 0.45;
  c.beginPath();
  c.moveTo(px, py - 21 + bob);
  c.lineTo(px, py - 12);
  c.stroke();
  for (const side of [-1, 1]) {
    c.fillStyle = '#6e5141';
    c.beginPath();
    c.ellipse(px + side * 1.25, py - 26 + bob, 0.42, 0.35, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c69e7a';
    c.beginPath();
    c.ellipse(px + side * 3, py - 13 + bob, 1.25, 0.9, 0, 0, Math.PI * 2);
    c.fill();
  }
  if (d === 0) {
    c.fillStyle = '#443c31';
    c.beginPath();
    c.ellipse(px - 3, py - 25 + bob, 1.4, 3.7, 0.2, 0, Math.PI * 2);
    c.fill();
  }
  if (d === 1) {
    c.strokeStyle = '#c5c1a8';
    c.lineWidth = 0.6;
    c.strokeRect(px - 3, py - 27 + bob, 2.6, 1.8);
    c.strokeRect(px + 0.3, py - 27 + bob, 2.6, 1.8);
  }
  if (d === 2) {
    c.fillStyle = '#c2b79f';
    c.beginPath();
    c.ellipse(px, py - 29 + bob, 3.5, 1.6, 0, Math.PI, Math.PI * 2);
    c.fill();
  }
  rect(c, px - 3, py - 15 + bob, 6, 4, '#8c7758');
  textureRect(c, px - 3, py - 15 + bob, 6, 4, 'wood', 0.4);
  c.lineCap = 'butt';
}
export function render(
  c: CanvasRenderingContext2D,
  m: SupplyModel,
  config: SupplyConfig,
  lane: number,
  reducedMotion = false,
  feedback = '',
) {
  c.save();
  c.textAlign = 'left';
  c.lineWidth = 1;
  c.setLineDash([]);
  rect(c, 0, 0, 640, 390, '#172333');
  // Fixed camera 2.5D warehouse: atmospheric depth and broad lit surfaces.
  const room = c.createLinearGradient(0, 86, 0, 345);
  room.addColorStop(0, '#9eafb4');
  room.addColorStop(0.45, '#607681');
  room.addColorStop(1, '#334958');
  c.fillStyle = room;
  c.fillRect(0, 86, 640, 260);
  for (let tx = 0; tx < 640; tx += 80)
    for (let ty = 86; ty < 346; ty += 80)
      textureRect(c, tx, ty, Math.min(80, 640 - tx), Math.min(80, 346 - ty), 'concrete', 0.19);
  poly(c, [0, 86, 640, 86, 575, 112, 68, 112], '#3c5264');
  poly(c, [0, 86, 68, 112, 68, 345, 0, 345], '#506573');
  poly(c, [640, 86, 575, 112, 575, 345, 640, 345], '#253e50');
  // Dusty daylight pools are grounded to the warehouse floor, not a screen wash.
  for (const lightX of [90, 310, 530]) {
    const light = c.createLinearGradient(lightX, 90, lightX + 60, 344);
    light.addColorStop(0, '#f5e7ba29');
    light.addColorStop(0.65, '#ead7a00e');
    light.addColorStop(1, '#d5bd8b00');
    c.fillStyle = light;
    c.beginPath();
    c.moveTo(lightX - 18, 90);
    c.lineTo(lightX + 18, 90);
    c.lineTo(lightX + 100, 344);
    c.lineTo(lightX - 85, 344);
    c.closePath();
    c.fill();
  }
  for (let beam = 0; beam < 8; beam++) {
    const x = beam * 92;
    poly(
      c,
      [x, 86, x + 11, 86, 320 + (x - 320) * 0.78, 112, 311 + (x - 320) * 0.78, 112],
      '#83959b',
    );
  }
  const floor = c.createLinearGradient(0, 95, 0, 345);
  floor.addColorStop(0, '#a7b8b0');
  floor.addColorStop(1, '#5a7376');
  c.fillStyle = floor;
  c.fillRect(63, 96, 518, 250);
  for (let tx = 63; tx < 581; tx += 70)
    for (let ty = 96; ty < 346; ty += 70)
      textureRect(c, tx, ty, Math.min(70, 581 - tx), Math.min(70, 346 - ty), 'asphalt', 0.16);
  for (let i = -5; i <= 8; i++) {
    const x = 320 + i * 72;
    c.strokeStyle = '#bed0c229';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(320 + (x - 320) * 0.3, 95);
    c.lineTo(x, 345);
    c.stroke();
  }
  for (let row = 0; row < 9; row++) {
    const y = 102 + row * row * 4;
    c.strokeStyle = '#304b5a30';
    c.beginPath();
    c.moveTo(60, y);
    c.lineTo(582, y);
    c.stroke();
  }
  for (let x = 30; x < 625; x += 120) {
    block(c, x, 90, 67, 15, 6, '#576e7b');
    poly(c, [x + 4, 92, x + 62, 92, x + 58, 98, x + 7, 98], '#dbeacb');
    poly(c, [x + 9, 99, x + 60, 99, x + 92, 152, x - 15, 152], '#e5f2c619');
  }
  panel(c, 7, 4, 630, 82, '#263548', '#64747c');
  for (let i = 0; i < 3; i++) portrait(c, i, 16 + i * 111, 6, reducedMotion ? 0 : m.time);
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
  if (feedback) {
    rect(c, 510, 68, 112, 15, '#163e35');
    label(c, feedback, 566, 79, '#b8f1c7', 10, true);
  }
  // Conveyor beds retain exactly the original interaction coordinates.
  for (let row = 0; row < 3; row++) {
    const y = 109 + row * 79;
    shadow(c, 264, y + 63, 249, 10, 0.27);
    for (const leg of [31, 461]) {
      block(c, leg, y + 49, 12, 26, 8, '#687d85');
      poly(c, [leg, y + 50, leg + 12, y + 50, leg + 12, y + 56, leg, y + 64], '#354b5e');
    }
    for (let softness = 0; softness < 4; softness++)
      shadow(c, 269, y + 61, 244 + softness * 2, 6 + softness * 1.7, 0.055);
    // Extruded chassis, recessed slats and faceted steel rollers.
    poly(
      c,
      [13, y + 6, 26, y - 3, 510, y - 3, 519, y + 8, 508, y + 55, 21, y + 58, 12, y + 46],
      '#182c3e',
    );
    poly(c, [20, y + 3, 507, y + 3, 513, y + 9, 17, y + 9], row === lane ? '#c3dacf' : '#a2b7b8');
    const belt = c.createLinearGradient(0, y + 8, 0, y + 51);
    belt.addColorStop(0, '#294454');
    belt.addColorStop(0.42, '#46616c');
    belt.addColorStop(1, '#1b3546');
    c.fillStyle = belt;
    c.fillRect(21, y + 8, 487, 42);
    for (let steelX = 21; steelX < 508; steelX += 42)
      textureRect(c, steelX, y + 8, Math.min(42, 508 - steelX), 42, 'steel', 0.18);
    for (let tile = 0; tile < 22; tile++) {
      const x = 23 + tile * 22;
      c.strokeStyle = '#142c3c';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y + 9);
      c.lineTo(x - 6, y + 49);
      c.stroke();
      c.strokeStyle = '#6b858544';
      c.beginPath();
      c.moveTo(x + 1, y + 10);
      c.lineTo(x - 5, y + 47);
      c.stroke();
      for (let n = 0; n < 4; n++) rect(c, x + 4, y + 16 + n * 7, 9, 1, '#93aa9a0d');
    }
    poly(c, [14, y + 48, 518, y + 48, 508, y + 60, 23, y + 60], '#6d8690');
    poly(c, [23, y + 54, 512, y + 54, 508, y + 60, 23, y + 60], '#314c60');
    poly(c, [14, y + 48, 518, y + 48, 516, y + 51, 18, y + 51], '#b9cecc');
    for (const cx of [22, 507]) {
      poly(
        c,
        [
          cx - 8,
          y + 13,
          cx - 3,
          y + 7,
          cx + 3,
          y + 7,
          cx + 8,
          y + 14,
          cx + 8,
          y + 43,
          cx + 3,
          y + 49,
          cx - 3,
          y + 49,
          cx - 8,
          y + 42,
        ],
        '#617d88',
      );
      poly(c, [cx - 3, y + 8, cx + 2, y + 8, cx + 3, y + 48, cx - 2, y + 48], '#bfd1cb');
      poly(c, [cx + 3, y + 10, cx + 7, y + 15, cx + 7, y + 42, cx + 3, y + 46], '#314e62');
    }
    // Turned steel bearings replace the angular roller ends; rust stays on housings.
    for (const cx of [22, 507]) {
      const steel = c.createLinearGradient(cx - 7, 0, cx + 7, 0);
      steel.addColorStop(0, '#263238');
      steel.addColorStop(0.3, '#a1aba7');
      steel.addColorStop(0.55, '#d1d1bd');
      steel.addColorStop(1, '#3b484c');
      c.fillStyle = steel;
      c.beginPath();
      c.ellipse(cx, y + 29, 6.8, 20.5, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#252e30';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(cx, y + 29, 3.5, 14, 0, 0, Math.PI * 2);
      c.stroke();
    }
    for (let weather = 0; weather < 36; weather++) {
      const xx = 32 + weather * 13.1;
      rect(
        c,
        xx,
        y + 55 + (weather % 3),
        2 + (weather % 4),
        0.7,
        weather % 2 ? '#92785666' : '#d4cdb638',
      );
    }
    for (let x = 49; x < 489; x += 64) {
      shadow(c, x, y + 56, 2, 1, 0.6);
      rect(c, x, y + 53, 2, 2, '#b6c9c6');
    }
    if (row === lane) poly(c, [2, y + 20, 12, y + 28, 2, y + 36], '#d8f2bc');
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
    building(c, d, 529, y + 1, reducedMotion ? 0 : m.time);
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
    shadow(c, x + 3, y + 34, 24, 6, 0.4);
    const wood = market ? '#a88192' : '#ae8756';
    block(c, x - 17, y + 3, 31, 30, 6, wood);
    poly(c, [x - 16, y + 3, x - 11, y - 2, x + 19, y - 2, x + 13, y + 3], tone(wood, 43));
    poly(c, [x - 17, y + 3, x - 12, y + 3, x - 12, y + 33, x - 17, y + 33], tone(wood, 24));
    poly(c, [x + 9, y + 3, x + 14, y + 3, x + 14, y + 33, x + 9, y + 33], tone(wood, 17));
    for (let n = 0; n < 3; n++) {
      rect(c, x - 12, y + 10 + n * 8, 22, 1, tone(wood, -26));
      rect(c, x - 10, y + 9 + n * 8, 17, 1, tone(wood, 18));
    }
    poly(c, [x - 10, y + 8, x + 9, y + 8, x + 8, y + 29, x - 9, y + 29], '#243d48');
    poly(
      c,
      [x - 9, y + 9, x + 8, y + 9, x + 7, y + 28, x - 8, y + 28],
      ['#aac6aa', '#cfabb8', '#9bc8c0'][crate.destination],
    );
    textureRect(c, x - 14, y + 4, 27, 30, 'wood', 0.27);
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
