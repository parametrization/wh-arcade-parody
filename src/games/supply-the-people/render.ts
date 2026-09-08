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
  shadow(c, x + 24, y + 37, 22, 4, 0.24);
  block(c, x + 5, y + 17, 30, 19, 7, ['#baa97c', '#b5c6bc', '#c5a17e'][d]);
  poly(c, [x, y + 18, x + 18, y + 6, x + 39, y + 17], ['#607d78', '#9e7e8a', '#4f8584'][d]);
  poly(
    c,
    [x + 18, y + 6, x + 25, y + 2, x + 46, y + 13, x + 39, y + 17],
    ['#8da996', '#c4a8ae', '#89b5a6'][d],
  );
  poly(c, [x + 39, y + 17, x + 46, y + 13, x + 40, y + 21], '#374f5e');
  for (const wx of [x + 10, x + 27]) {
    rect(c, wx, y + 23, 5, 7, '#314e61');
    poly(c, [wx, y + 23, wx + 5, y + 23, wx, y + 28], '#c8e1d2');
  }
  rect(c, x + 18, y + 23, 7, 13, '#345468');
  rect(c, x + 19, y + 24, 5, 2, '#c8d9cb');
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
  // Fixed camera 2.5D warehouse: atmospheric depth and broad lit surfaces.
  const room = c.createLinearGradient(0, 86, 0, 345);
  room.addColorStop(0, '#9eafb4');
  room.addColorStop(0.45, '#607681');
  room.addColorStop(1, '#334958');
  c.fillStyle = room;
  c.fillRect(0, 86, 640, 260);
  poly(c, [0, 86, 640, 86, 575, 112, 68, 112], '#3c5264');
  poly(c, [0, 86, 68, 112, 68, 345, 0, 345], '#506573');
  poly(c, [640, 86, 575, 112, 575, 345, 640, 345], '#253e50');
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
    shadow(c, 264, y + 63, 249, 10, 0.27);
    for (const leg of [31, 461]) {
      block(c, leg, y + 49, 12, 26, 8, '#687d85');
      poly(c, [leg, y + 50, leg + 12, y + 50, leg + 12, y + 56, leg, y + 64], '#354b5e');
    }
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
