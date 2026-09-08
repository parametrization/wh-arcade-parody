import { drawBurger } from '../../shared/sprites/burger';
import { CAST, type Model } from './model';
import { value } from './config';
export function render(
  ctx: CanvasRenderingContext2D,
  m: Model,
  portraits?: HTMLImageElement,
  background?: HTMLImageElement,
) {
  const variant = m.config['presentation.assetVariant'];
  const sky = variant === 'B' ? '#ead6b6' : variant === 'C' ? '#0e3451' : '#83cce4';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 448);
  const reduced = !!m.config['presentation.reducedMotion'];
  const offset = reduced ? 0 : m.time * 12;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  // Stepped sixteen-bit sky bands and sparse checker dithering, without smooth gradients.
  const bands =
    variant === 'C'
      ? ['#183759', '#214867', '#2e5b77', '#3c7188', '#568d9c']
      : variant === 'B'
        ? ['#c9b6ac', '#dac6b1', '#e7d5bb', '#efe2c8', '#f4ebd9']
        : ['#487ca9', '#5d96bd', '#78b3ce', '#9bcddd', '#b8e0e5'];
  bands.forEach((color, i) => rect(0, i * 66, 512, 68, color));
  for (let i = 0; i < 4; i++)
    for (let x = 0; x < 512; x += 8) rect(x + (i % 2) * 4, (i + 1) * 66 - 4, 4, 4, bands[i + 1]);
  for (let i = 0; i < 7; i++) {
    const x = ((((i * 104 - offset) % 650) + 650) % 650) - 90;
    rect(x, 42 + (i % 3) * 31, 70, 10, '#e5f7f8');
    rect(x + 16, 34 + (i % 3) * 31, 35, 10, '#f2f5df');
    rect(x + 8, 52 + (i % 3) * 31, 58, 5, '#b4d7dd');
    rect(x + 24, 30 + (i % 3) * 31, 20, 5, '#fffbe7');
  }
  for (let i = 0; i < 18; i++) {
    const x = i * 34 - ((offset * 0.15) % 34),
      height = 30 + (i % 4) * 12;
    rect(x, 302 - height, 28, height, '#739eaf');
    rect(x + 5, 298 - height, 18, 5, '#8bb4be');
  }
  rect(0, 310, 512, 78, '#598e9c');
  for (let i = 0; i < 6; i++) {
    const x = i * 108 - ((offset * 0.4) % 108);
    rect(x, 270, 80, 118, '#bad5d7');
    rect(x + 8, 258, 64, 12, '#d5e4de');
    for (let j = 0; j < 4; j++) {
      rect(x + 10 + j * 17, 286, 9, 80, '#759aa7');
      rect(x + 10 + j * 17, 286, 2, 78, '#edf0d5');
      rect(x + 17 + j * 17, 286, 2, 78, '#52788d');
    }
    rect(x, 270, 80, 3, '#fff4d8');
    rect(x + 4, 275, 72, 4, '#8eb5bf');
  }
  rect(194, 238, 124, 10, '#d5e4de');
  rect(208, 225, 96, 13, '#d5e4de');
  rect(226, 207, 60, 18, '#d5e4de');
  rect(252, 190, 8, 17, '#f7edc8');
  rect(255, 174, 2, 20, '#5d7f93');
  rect(257, 175, 20, 11, '#f0ebd6');
  for (let j = 0; j < 5; j++) rect(257, 175 + j * 2, 20, 1, '#b95660');
  rect(257, 175, 8, 6, '#36547b');
  for (let i = 0; i < 12; i++) {
    const x = i * 48 - ((offset * 0.7) % 48);
    rect(x + 12, 351, 5, 36, '#526445');
    rect(x, 343, 30, 17, '#356b58');
    rect(x + 7, 335, 20, 18, '#548670');
    rect(x + 11, 334, 10, 5, '#739d7b');
  }
  if (background)
    ctx.drawImage(
      background,
      0,
      0,
      background.naturalWidth,
      background.naturalHeight,
      0,
      0,
      512,
      388,
    );
  for (const col of m.columns) {
    const w = value(m.config, 'columns.width'),
      bottom = col.gapY + col.gap;
    for (const [y, h] of [
      [0, col.gapY],
      [bottom, 388 - bottom],
    ]) {
      rect(col.x, y, w, h, '#554c59');
      rect(col.x + 4, y, w - 8, h, '#d2c5a5');
      for (let j = 8; j < w - 4; j += 10) {
        rect(col.x + j, y, 5, h, '#a4977c');
        rect(col.x + j, y, 1, h, '#f2e6be');
        rect(col.x + j + 4, y, 1, h, '#817263');
      }
      rect(col.x + 4, y, 2, h, '#fff1cc');
      rect(col.x + w - 6, y, 2, h, '#837367');
      for (let band = 18; band < h; band += 44) {
        rect(col.x + 3, y + band, w - 6, 2, '#bcad90');
        rect(col.x + 4, y + band + 2, w - 8, 1, '#eee0b8');
      }
    }
    rect(col.x - 4, col.gapY - 12, w + 8, 12, '#eee1be');
    rect(col.x - 4, bottom, w + 8, 12, '#eee1be');
    rect(col.x - 6, col.gapY - 14, w + 12, 3, '#fff3d2');
    rect(col.x - 6, bottom, w + 12, 3, '#fff3d2');
    person(col.x + w / 2, bottom + 7, col.name, false);
    person(col.x + w / 2, col.gapY - 3, col.topName, true);
    if (col.burger && !col.collected) hamburger(col.x + w / 2, col.gapY + col.gap / 2);
    if (m.config['presentation.showColliders']) {
      ctx.strokeStyle = '#ff00ff';
      ctx.strokeRect(col.x, 0, w, col.gapY);
      ctx.strokeRect(col.x, bottom, w, 388 - bottom);
    }
  }
  // A pale path and shaded lawn continue the Mall scene without arcade stripes.
  rect(0, 388, 512, 3, '#ddd5b2');
  rect(0, 391, 512, 7, '#b6ad8b');
  rect(0, 398, 512, 2, '#777f5b');
  rect(0, 400, 512, 48, '#547d39');
  rect(0, 400, 512, 5, '#799449');
  for (let yy = 406; yy < 448; yy += 5)
    for (let xx = 0; xx < 512; xx += 7) {
      const n = (xx * 19 + yy * 31) % 13;
      rect(
        xx + (yy % 3),
        yy,
        n < 4 ? 3 : 1,
        n < 4 ? 1 : 2,
        n < 4 ? '#819447' : n < 8 ? '#426533' : '#637f37',
      );
    }
  for (let xx = 0; xx < 512; xx += 40) {
    rect(xx, 392, 1, 5, '#968f76');
    rect(xx + 15, 394, 3, 1, '#d5cbaa');
  }
  const wing = reduced ? 1 : Math.floor(m.time * 12) % 3;
  const y = m.y;
  eagle(125, y - 5, wing);
  if (m.config['presentation.showColliders']) {
    ctx.strokeStyle = '#ff00ff';
    ctx.strokeRect(142, y + 12, 24, 16);
  }
  if (m.deliveries > 0) {
    rect(386, 354, 110, 34, '#754b42');
    rect(394, 339, 94, 17, '#ffe3a2');
    ctx.fillStyle = '#1a2935';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('PUBLIC RECORD', 398, 351);
    for (let i = 0; i < 4; i++) {
      rect(400 + i * 23, 367, 12, 21, ['#c15657', '#42639e', '#ead094', '#c17840'][i]);
      rect(402 + i * 23, 359, 8, 9, ['#d6a17b', '#9e6749', '#ecbb92', '#70492e'][i]);
    }
  }
  const e = m.event;
  if (e.phase === 'telegraph') {
    ctx.fillStyle = '#122644';
    ctx.fillRect(e.side === 'left' ? 0 : 340, 12, 172, 31);
    ctx.fillStyle = '#ffe39b';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${e.side === 'left' ? '←' : '→'} DISTRACTION!`, e.side === 'left' ? 8 : 348, 32);
  }
  if (['entering', 'obscuring', 'exiting'].includes(e.phase)) {
    let progress =
      e.phase === 'entering'
        ? 1 - e.remaining / 0.5
        : e.phase === 'exiting'
          ? e.remaining / 0.25
          : 1;
    progress = Math.max(0, Math.min(1, progress));
    const from = e.side === 'left' ? -180 : 512;
    const target = e.side === 'left' ? 12 : 340;
    const x = from + (target - from) * progress;
    const bounce = e.side === 'right' && !reduced ? Math.sin(progress * Math.PI) * 40 : 0;
    trump(x, 170 - bounce, e.phase === 'exiting');
    if (e.phase === 'exiting' && e.cause === 'burger') {
      const travel = Math.min(1, (0.25 - e.remaining) / 0.2);
      const endX = x + 87,
        endY = 242 - bounce;
      hamburger(
        154 + (endX - 154) * travel,
        m.y + 20 + (endY - m.y - 20) * travel - Math.sin(travel * Math.PI) * 35,
      );
    }
  }
  function eagle(x: number, y: number, frame: number) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    const shape = (points: number[][], color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
      ctx.closePath();
      ctx.fill();
    };
    // Layered flight feathers, with three distinct wing silhouettes.
    const lift = [-7, 0, 9][frame];
    shape(
      [
        [22, 18],
        [10, 10 + lift],
        [1, 5 + lift],
        [-7, 1 + lift],
        [-5, 8 + lift],
        [-10, 6 + lift],
        [-6, 15 + lift],
        [-11, 14 + lift],
        [-6, 23 + lift],
        [4, 29],
        [20, 30],
      ],
      '#202c30',
    );
    shape(
      [
        [20, 18],
        [8, 12 + lift],
        [-4, 5 + lift],
        [-1, 14 + lift],
        [-6, 12 + lift],
        [-1, 22 + lift],
        [7, 25],
        [18, 28],
      ],
      '#694c37',
    );
    for (let f = 0; f < 5; f++) {
      const yy = 10 + lift + f * 3;
      shape(
        [
          [f - 5, yy],
          [f + 6, yy + 5],
          [15 + f, 23],
          [13 + f, 27],
          [f + 2, yy + 9],
        ],
        f % 2 ? '#94714a' : '#bd945c',
      );
      rect(f - 4, yy + 1, 2, 2, '#ddbd7a');
    }
    shape(
      [
        [8, 23],
        [22, 13],
        [37, 14],
        [42, 23],
        [36, 34],
        [20, 38],
        [4, 36],
        [-4, 39],
        [-2, 31],
      ],
      '#273030',
    );
    shape(
      [
        [8, 25],
        [24, 17],
        [36, 18],
        [38, 27],
        [30, 34],
        [15, 35],
        [3, 33],
      ],
      '#684c36',
    );
    shape(
      [
        [13, 24],
        [25, 20],
        [34, 21],
        [29, 28],
        [17, 32],
        [8, 30],
      ],
      '#a47e4e',
    );
    for (let f = 0; f < 9; f++) {
      const fx = 7 + ((f * 7) % 25),
        fy = 25 + Math.floor(f / 4) * 4;
      rect(fx, fy, 4, 2, f % 3 ? '#c09b62' : '#4d3c31');
      rect(fx + 1, fy + 2, 2, 1, '#463b32');
    }
    shape(
      [
        [-2, 31],
        [8, 31],
        [11, 35],
        [1, 41],
        [-7, 41],
        [-5, 37],
        [-10, 37],
      ],
      '#eee7cf',
    );
    rect(-5, 35, 9, 2, '#aeb9b3');
    // Sculpted white head, feathered neck and hooked golden beak.
    shape(
      [
        [26, 8],
        [32, 3],
        [44, 3],
        [49, 7],
        [49, 17],
        [43, 22],
        [38, 27],
        [34, 24],
        [32, 28],
        [29, 22],
        [25, 22],
        [27, 17],
        [24, 15],
      ],
      '#263638',
    );
    shape(
      [
        [28, 9],
        [33, 5],
        [44, 5],
        [47, 8],
        [46, 17],
        [40, 20],
        [36, 25],
        [33, 20],
        [30, 24],
        [30, 19],
        [26, 19],
        [29, 14],
      ],
      '#f4f0d9',
    );
    shape(
      [
        [30, 8],
        [35, 5],
        [43, 6],
        [45, 8],
        [34, 10],
        [28, 13],
      ],
      '#ffffff',
    );
    shape(
      [
        [28, 17],
        [32, 16],
        [34, 20],
        [38, 18],
        [40, 21],
        [36, 25],
        [33, 20],
        [30, 24],
      ],
      '#bbc8c3',
    );
    shape(
      [
        [44, 12],
        [49, 11],
        [56, 14],
        [59, 18],
        [55, 24],
        [54, 19],
        [45, 18],
        [42, 16],
      ],
      '#3d372a',
    );
    shape(
      [
        [45, 12],
        [50, 13],
        [55, 15],
        [57, 18],
        [55, 21],
        [54, 17],
        [45, 16],
      ],
      '#f3b947',
    );
    rect(47, 13, 6, 1, '#ffe17c');
    rect(44, 17, 10, 2, '#b77726');
    rect(39, 11, 6, 2, '#75683c');
    rect(41, 12, 3, 3, '#162c32');
    rect(42, 12, 1, 1, '#fff6d2');
    rect(37, 9, 8, 2, '#fffdf0');
    shape(
      [
        [21, 34],
        [24, 34],
        [24, 40],
        [29, 41],
        [28, 43],
        [21, 42],
        [19, 40],
      ],
      '#dda442',
    );
    shape(
      [
        [33, 32],
        [36, 32],
        [36, 39],
        [41, 40],
        [40, 42],
        [34, 41],
        [32, 38],
      ],
      '#f3bf57',
    );
    rect(16, 41, 34, 20, '#483d31');
    rect(17, 42, 32, 18, '#c9ac74');
    rect(19, 39, 13, 5, '#ebcd8d');
    rect(18, 43, 30, 3, '#f9e4b3');
    rect(18, 46, 30, 13, '#ecdbaf');
    ctx.fillStyle = '#4a3540';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('EPSTEIN', 19, 51);
    ctx.fillText('FILES', 23, 58);
    ctx.restore();
  }
  function hamburger(x: number, y: number) {
    drawBurger(ctx, x, y);
  }

  function portrait(name: string, x: number, y: number, size: number) {
    const index = CAST.indexOf(name);
    if (!portraits || index < 0) return false;
    const cellW = portraits.naturalWidth / 4,
      cellH = portraits.naturalHeight / 2;
    const sx = Math.round((index % 4) * cellW),
      sy = Math.round(Math.floor(index / 4) * cellH);
    const ex = Math.round(((index % 4) + 1) * cellW),
      ey = Math.round((Math.floor(index / 4) + 1) * cellH);
    ctx.drawImage(portraits, sx, sy, ex - sx, ey - sy, x, y, size, size);
    return true;
  }
  function person(x: number, y: number, name: string, up: boolean) {
    const id = CAST.indexOf(name);
    ctx.save();
    const size = up ? Math.min(52, Math.max(40, y - 3)) : 52;
    ctx.translate(Math.round(x), Math.round(up ? y - size : y));
    if (portraits) {
      rect(-size / 2 - 3, -3, size + 6, size + 6, '#302436');
      rect(-size / 2 - 2, -2, size + 4, size + 4, '#e5c486');
      portrait(name, -size / 2, 0, size);
      rect(size / 2 - 11, size - 12, 10, 10, '#af334b');
      rect(size / 2 - 9, size - 10, 6, 3, '#fff0cd');
      rect(size / 2 - 5, size - 8, 2, 4, '#fff0cd');
      ctx.restore();
      return;
    }
    // Body, medals and party insignia remain distinct from the fixed collision rectangle.
    rect(-23, 30, 46, 29, '#571d36');
    rect(-20, 30, 39, 25, '#ae344b');
    rect(-16, 31, 10, 22, '#d05b64');
    rect(12, 32, 6, 21, '#832a42');
    rect(-7, 31, 14, 16, '#fff0d5');
    rect(-2, 35, 5, 20, '#243b62');
    // Ivory elephant shoulder pin: party symbolism, not an interchangeable face.
    rect(12, 38, 9, 5, '#eedbb1');
    rect(18, 41, 3, 7, '#eedbb1');
    rect(11, 43, 2, 4, '#eedbb1');
    if (!portrait(name, -26, -1, 52)) {
      const skin =
        ['#e99761', '#c79976', '#d2a180', '#c79878', '#dfb296', '#e2b69b', '#d0a084'][id] ??
        '#d5a480';
      const hair =
        ['#efcb57', '#594238', '#51413b', '#8b8377', '#dbd4c4', '#c3b49f', '#a39f94'][id] ??
        '#766358';
      rect(-18, 1, 36, 32, '#433541');
      rect(-16, 3, 32, 28, skin);
      rect(-19, 1, 37, 8, hair);
      rect(-17, 8, 4, 9, hair);
      rect(14, 7, 4, 11, hair);
      rect(-12, 12, 8, 3, '#4c3a38');
      rect(5, 12, 8, 3, '#4c3a38');
      rect(-10, 15, 3, 3, '#202b3f');
      rect(8, 15, 3, 3, '#202b3f');
      rect(-2, 17, 5, 7, '#b87959');
      rect(-6, 26, 14, 2, '#834d48');
      if (id === 1) {
        rect(-15, 23, 29, 9, '#634a40');
        rect(-7, 25, 13, 3, '#e0b093');
      }
      if (id === 2 || id === 4) {
        ctx.strokeStyle = '#283d4b';
        ctx.lineWidth = 2;
        ctx.strokeRect(-14, 12, 12, 8);
        ctx.strokeRect(3, 12, 12, 8);
        rect(-2, 15, 5, 2, '#283d4b');
      }
    }
    ctx.restore();
  }
  function trump(x: number, y: number, exit: boolean) {
    rect(x + 16, y + 77, 134, 127, '#132c59');
    rect(x + 35, y + 146, 100, 54, '#284873');
    rect(x + 26, y + 194, 120, 12, '#1e3c69');
    rect(x + 20, y + 88, 13, 107, '#35527d');
    rect(x + 133, y + 91, 12, 108, '#0b1c40');
    rect(x + 38, y + 141, 89, 9, '#3e608a');
    rect(x + 47, y + 150, 69, 30, '#345579');
    rect(x + 48, y + 180, 69, 9, '#213e67');
    rect(x + 45, y + 89, 19, 58, '#203756');
    rect(x + 104, y + 88, 20, 60, '#203756');
    rect(x + 42, y + 56, 82, 47, '#df854c');
    rect(x + 30, y + 14, 100, 71, '#ef9356');
    rect(x + 24, y + 10, 110, 20, '#f9d556');
    rect(x + 43, y, 91, 17, '#f9d556');
    rect(x + 117, y + 16, 23, 21, '#f5c748');
    rect(x + 52, y + 38, 13, 5, '#7e4d3c');
    rect(x + 97, y + 38, 13, 5, '#7e4d3c');
    rect(x + 37, y + 29, 8, 36, '#f9b375');
    rect(x + 117, y + 28, 10, 39, '#bf653d');
    rect(x + 68, y + 43, 18, 16, '#dc7847');
    rect(x + 43, y + 54, 16, 5, '#e58651');
    rect(x + 102, y + 54, 13, 5, '#d97948');
    if (portraits) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x + 82, y + 47, 57, 61, 0, 0, Math.PI * 2);
      ctx.clip();
      portrait('Donald Trump', x + 15, y - 16, 132);
      ctx.restore();
    }
    rect(x + 73, y + 66, 31, exit ? 16 : 6, '#7c3038');
    rect(x + 62, y + 99, 39, 21, '#f8eadb');
    rect(x + 79, y + 111, 14, 100, '#c8293b');
    rect(x + 80, y + 117, 4, 90, '#ed5b55');
    rect(x + 89, y + 115, 4, 94, '#8b1e39');
    rect(x + 49, y + 110, 5, 5, '#d8b966');
    if (exit && m.event.cause === 'burger') hamburger(x + 87, y + 72);
    if (!exit) {
      const coverage = Math.min(
        m.config['assist.enabled'] ? 0.2 : 0.7,
        value(m.config, 'presentation.coverage'),
      );
      ctx.globalAlpha = m.config['assist.enabled'] ? 0.65 : 1;
      const handWidth = 30 + coverage * 95;
      const hx = m.event.side === 'left' ? x + 112 : x - handWidth + 44;
      rect(hx, y + 12, handWidth, 108, '#ee975e');
      rect(hx + 5, y + 23, 8, 86, '#ffb378');
      rect(hx + handWidth - 8, y + 26, 8, 90, '#c97648');
      rect(hx + 12, y + 60, handWidth - 23, 3, '#d18051');
      rect(hx + 17, y + 81, handWidth - 28, 3, '#d18051');
      for (let i = 0; i < 4; i++)
        rect(hx + i * (handWidth / 4), y - 26 + (i % 2) * 9, handWidth / 4 - 3, 60, '#f7a66a');
      rect(x - 5, y + 104, 46, 69, '#ee975e');
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#fff0b5';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('DONALD TRUMP', x + 24, y + 224);
  }
}
