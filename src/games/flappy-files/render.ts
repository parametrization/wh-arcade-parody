import { drawFlight } from './eagle';
import { drawHead } from './heads';
import { textureRect } from '../../shared/fidelity/materials';
import { grain, litFill } from './materials';
import { drawBurger } from './burger';
import { CAST, type Model } from './model';
import { value } from './config';
import { drawColumnCharacter, rigHeight } from './characters';
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
  const facet = (points: number[][], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  };
  // Preserve the painted Mall scene as a low-resolution texture behind lit geometry.
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
  if (background) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
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
    ctx.restore();
  }
  // Distance haze and directional sun give the backdrop depth without moving the playfield.
  const haze = ctx.createLinearGradient(0, 150, 0, 388);
  haze.addColorStop(0, 'rgba(193,222,239,0)');
  haze.addColorStop(0.65, 'rgba(197,219,222,.17)');
  haze.addColorStop(1, 'rgba(128,166,162,.04)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 150, 512, 238);
  const sun = ctx.createRadialGradient(86, 38, 3, 86, 38, 240);
  sun.addColorStop(0, 'rgba(255,239,185,.15)');
  sun.addColorStop(1, 'rgba(255,239,185,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 512, 388);
  const atmosphere = ctx.createRadialGradient(270, 160, 60, 256, 210, 340);
  atmosphere.addColorStop(0, 'rgba(255,227,178,0)');
  atmosphere.addColorStop(1, 'rgba(18,27,32,.22)');
  ctx.fillStyle = atmosphere;
  ctx.fillRect(0, 0, 512, 388);
  for (const col of m.columns) {
    const w = value(m.config, 'columns.width'),
      bottom = col.gapY + col.gap;
    const upperMount = col.gapY - rigHeight(col.gapY, true),
      lowerMount = bottom + rigHeight(388 - bottom);
    for (const [y, h] of [
      [0, Math.max(0, upperMount)],
      [lowerMount, Math.max(0, 388 - lowerMount)],
    ]) {
      rect(col.x, y, w, h, '#554c59');
      // A six-sided stone shaft: broad lit face, beveled edges, cool shadow face.
      facet(
        [
          [col.x, y],
          [col.x + w * 0.14, y],
          [col.x + w * 0.14, y + h],
          [col.x, y + h],
        ],
        '#b7ae99',
      );
      facet(
        [
          [col.x + w * 0.14, y],
          [col.x + w * 0.44, y],
          [col.x + w * 0.44, y + h],
          [col.x + w * 0.14, y + h],
        ],
        '#eee1bf',
      );
      facet(
        [
          [col.x + w * 0.44, y],
          [col.x + w * 0.74, y],
          [col.x + w * 0.74, y + h],
          [col.x + w * 0.44, y + h],
        ],
        '#d5c6a6',
      );
      facet(
        [
          [col.x + w * 0.74, y],
          [col.x + w, y],
          [col.x + w, y + h],
          [col.x + w * 0.74, y + h],
        ],
        '#938d7e',
      );
      const stoneLight = ctx.createLinearGradient(col.x + w, y, col.x, y);
      stoneLight.addColorStop(0, '#615a4e');
      stoneLight.addColorStop(0.22, '#ded4bd');
      stoneLight.addColorStop(0.52, '#b9ad93');
      stoneLight.addColorStop(0.85, '#766d5c');
      stoneLight.addColorStop(1, '#302e2b');
      ctx.fillStyle = stoneLight;
      ctx.fillRect(col.x, y, w, h);
      grain(ctx, 'stone', col.x, y, w, h, 0.35);
      // Square material patches keep mineral grain proportional on tall shafts.
      ctx.save();
      ctx.beginPath();
      ctx.rect(col.x, y, w, h);
      ctx.clip();
      for (let ty = y; ty < y + h; ty += w) textureRect(ctx, col.x, ty, w, w, 'limestone', 0.55);
      ctx.restore();
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
    // Stone supports end at the rig mount: figures hang beneath the upper capital
    // and plant their feet (or couch) on the lower capital, never pasted on a shaft.
    rect(col.x - 5, upperMount - 6, w + 10, 6, '#d7c39a');
    rect(col.x - 7, upperMount - 8, w + 14, 3, '#fff3d2');
    rect(col.x - 5, lowerMount, w + 10, 7, '#d7c39a');
    rect(col.x - 7, lowerMount, w + 14, 3, '#fff3d2');
    facet(
      [
        [col.x - 7, lowerMount],
        [col.x + 2, lowerMount - 5],
        [col.x + w + 5, lowerMount - 5],
        [col.x + w + 7, lowerMount],
        [col.x - 7, lowerMount],
      ],
      '#f4e7c6',
    );
    facet(
      [
        [col.x + w - 1, lowerMount + 3],
        [col.x + w + 7, lowerMount],
        [col.x + w + 7, lowerMount + 6],
        [col.x + w - 1, lowerMount + 9],
      ],
      '#8c8a7a',
    );
    facet(
      [
        [col.x - 7, upperMount - 8],
        [col.x + w + 7, upperMount - 8],
        [col.x + w + 3, upperMount - 3],
        [col.x - 3, upperMount - 3],
      ],
      '#eadbb8',
    );
    for (const mount of [upperMount - 8, lowerMount]) {
      textureRect(ctx, col.x - 5, mount, w + 10, 7, 'concrete', 0.58);
      ctx.strokeStyle = 'rgba(70,61,45,.4)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(col.x + w * 0.7, mount);
      ctx.lineTo(col.x + w * 0.68, mount + 3);
      ctx.lineTo(col.x + w * 0.73, mount + 6);
      ctx.stroke();
    }
    // Soft contact shadow is offset away from the right-hand sunlight.
    ctx.save();
    ctx.shadowColor = 'rgba(10,16,19,.45)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(20,25,28,.35)';
    ctx.beginPath();
    ctx.ellipse(col.x + w * 0.43, lowerMount - 1, w * 0.42, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(20,30,42,.28)';
    ctx.beginPath();
    ctx.ellipse(col.x + w / 2 + 4, lowerMount - 1, w * 0.42, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    drawColumnCharacter(ctx, {
      name: col.name,
      x: col.x + w / 2,
      edge: bottom,
      upper: false,
      available: 388 - bottom,
      time: m.time,
      eagleX: 154,
      eagleY: m.y + 20,
      reducedMotion: reduced,
      atlas: portraits,
    });
    drawColumnCharacter(ctx, {
      name: col.topName,
      x: col.x + w / 2,
      edge: col.gapY,
      upper: true,
      available: col.gapY,
      time: m.time,
      eagleX: 154,
      eagleY: m.y + 20,
      reducedMotion: reduced,
      atlas: portraits,
    });
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
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 388, 512, 60);
  ctx.clip();
  for (let x = 0; x < 512; x += 64) textureRect(ctx, x, 388, 64, 64, 'asphalt', 0.8);
  ctx.restore();
  for (const column of m.columns) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 388, 512, 60);
    ctx.clip();
    ctx.fillStyle = 'rgba(16,20,21,.25)';
    ctx.beginPath();
    ctx.moveTo(column.x, 388);
    ctx.lineTo(column.x + value(m.config, 'columns.width'), 388);
    ctx.lineTo(column.x - 18, 440);
    ctx.lineTo(column.x - 60, 440);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Soft projected shadow supplies a ground reference while the eagle remains freely airborne.
  ctx.fillStyle = 'rgba(14,35,38,.19)';
  ctx.beginPath();
  ctx.ellipse(159, 402, 12 + (352 - m.y) * 0.025, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const wing = reduced ? 1 : Math.floor(m.time * 12) % 3;
  const y = m.y;
  if (!drawFlight(ctx, m.time, y, reduced)) eagle(125, y - 5, wing);
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
      const last = points[points.length - 1];
      ctx.moveTo((last[0] + points[0][0]) / 2, (last[1] + points[0][1]) / 2);
      points.forEach(([a, b], i) => {
        const next = points[(i + 1) % points.length];
        ctx.quadraticCurveTo(a, b, (a + next[0]) / 2, (b + next[1]) / 2);
      });
      ctx.closePath();
      litFill(ctx, color, -12, -12, 72, 68);
      ctx.save();
      ctx.clip();
      grain(ctx, 'feather', -12, -12, 72, 68, 0.38);
      ctx.restore();
    };
    // Layered flight feathers, with three distinct wing silhouettes.
    const lift = reduced ? 0 : Math.sin(m.time * 12) * 8;
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
    // Broad triangular feathers and lit head planes read as a small low-polygon model.
    shape(
      [
        [8, 23],
        [23, 17],
        [31, 21],
        [16, 29],
      ],
      '#a88a58',
    );
    shape(
      [
        [16, 29],
        [31, 21],
        [35, 28],
        [26, 34],
      ],
      '#6d5940',
    );
    shape(
      [
        [24, 17],
        [30, 13],
        [34, 20],
        [31, 21],
      ],
      '#c4b07c',
    );
    shape(
      [
        [30, 7],
        [39, 5],
        [44, 8],
        [36, 12],
      ],
      '#fffdf0',
    );
    shape(
      [
        [29, 13],
        [36, 12],
        [34, 20],
        [29, 21],
      ],
      '#ccd9d4',
    );
    shape(
      [
        [44, 13],
        [52, 14],
        [57, 18],
        [49, 16],
      ],
      '#ffda71',
    );
    shape(
      [
        [49, 16],
        [57, 18],
        [55, 22],
        [54, 18],
      ],
      '#b17b36',
    );
    shape(
      [
        [0, 9 + lift],
        [8, 14 + lift],
        [21, 22],
        [11, 22],
      ],
      '#b89a68',
    );
    shape(
      [
        [11, 22],
        [21, 22],
        [17, 29],
        [3, 24],
      ],
      '#6d5b40',
    );
    // Preserve the recognizable eye and the exact files text over the lit mesh.
    rect(41, 12, 3, 3, '#162c32');
    rect(42, 12, 1, 1, '#fff6d2');
    shape(
      [
        [49, 43],
        [53, 40],
        [53, 57],
        [49, 61],
      ],
      '#9d8e68',
    );
    shape(
      [
        [17, 42],
        [22, 39],
        [53, 40],
        [49, 44],
      ],
      '#fff0bd',
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
    ctx.save();
    ctx.fillStyle = 'rgba(40,28,22,.22)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 15, 16, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    drawBurger(ctx, x, y);
    facet(
      [
        [x - 11, y - 6],
        [x - 4, y - 9],
        [x + 6, y - 8],
        [x + 12, y - 4],
        [x + 4, y - 5],
        [x - 4, y - 3],
      ],
      'rgba(255,225,157,.24)',
    );
    ctx.restore();
  }

  function portrait(name: string, x: number, y: number, size: number) {
    const index = CAST.indexOf(name);
    if (!portraits || index < 0) return false;
    drawHead(ctx, portraits, index === 0 ? 7 : index, x, y, size);
    return true;
  }
  function trump(x: number, y: number, exit: boolean) {
    ctx.beginPath();
    ctx.moveTo(x + 56, y + 77);
    ctx.bezierCurveTo(x + 20, y + 77, x + 12, y + 104, x + 17, y + 137);
    ctx.bezierCurveTo(x + 4, y + 170, x + 16, y + 188, x + 17, y + 204);
    ctx.quadraticCurveTo(x + 77, y + 217, x + 145, y + 204);
    ctx.bezierCurveTo(x + 156, y + 177, x + 157, y + 138, x + 147, y + 111);
    ctx.quadraticCurveTo(x + 138, y + 80, x + 110, y + 77);
    ctx.closePath();
    litFill(ctx, '#233e60', x + 10, y + 76, 147, 135);
    ctx.save();
    ctx.clip();
    textureRect(ctx, x + 10, y + 76, 147, 135, 'wool', 0.38);
    const belly = ctx.createRadialGradient(x + 87, y + 164, 3, x + 87, y + 164, 67);
    belly.addColorStop(0, 'rgba(130,150,168,.2)');
    belly.addColorStop(1, 'rgba(2,12,25,.2)');
    ctx.fillStyle = belly;
    ctx.fillRect(x + 10, y + 76, 147, 135);
    ctx.restore();
    ctx.strokeStyle = 'rgba(8,19,32,.4)';
    ctx.lineWidth = 1;
    for (const [px, py] of [
      [42, 137],
      [120, 143],
      [54, 191],
      [101, 191],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x + px - 10, y + py);
      ctx.quadraticCurveTo(x + px, y + py + 5, x + px + 12, y + py - 2);
      ctx.stroke();
    }
    if (!portraits) {
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
    }
    if (portraits) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x + 82, y + 47, 57, 61, 0, 0, Math.PI * 2);
      ctx.clip();
      portrait('Donald Trump', x + 15, y - 16, 132);
      ctx.restore();
    }
    if (exit) {
      ctx.fillStyle = '#542528';
      ctx.beginPath();
      ctx.ellipse(x + 87, y + 77, 13, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    rect(x + 62, y + 99, 39, 21, '#f8eadb');
    rect(x + 79, y + 111, 14, 100, '#c8293b');
    rect(x + 80, y + 117, 4, 90, '#ed5b55');
    rect(x + 89, y + 115, 4, 94, '#8b1e39');
    rect(x + 49, y + 110, 5, 5, '#d8b966');
    facet(
      [
        [x + 20, y + 86],
        [x + 43, y + 80],
        [x + 65, y + 145],
        [x + 39, y + 130],
      ],
      '#38547b',
    );
    facet(
      [
        [x + 43, y + 80],
        [x + 66, y + 96],
        [x + 72, y + 146],
        [x + 65, y + 145],
      ],
      '#142d50',
    );
    facet(
      [
        [x + 106, y + 93],
        [x + 134, y + 84],
        [x + 145, y + 191],
        [x + 120, y + 169],
      ],
      '#102747',
    );
    facet(
      [
        [x + 35, y + 150],
        [x + 85, y + 140],
        [x + 125, y + 153],
        [x + 102, y + 175],
        [x + 46, y + 178],
      ],
      '#335275',
    );
    if (exit && m.event.cause === 'burger') hamburger(x + 87, y + 72);
    if (!exit) {
      const coverage = Math.min(
        m.config['assist.enabled'] ? 0.2 : 0.7,
        value(m.config, 'presentation.coverage'),
      );
      ctx.globalAlpha = m.config['assist.enabled'] ? 0.65 : 1;
      const handWidth = 30 + coverage * 95;
      const hx = m.event.side === 'left' ? x + 112 : x - handWidth + 44;
      const skin = (px: number, py: number, w: number, h: number, r: number) => {
        const light = ctx.createLinearGradient(px, py, px + w, py + h);
        light.addColorStop(0, '#f3bc91');
        light.addColorStop(0.35, '#dea276');
        light.addColorStop(1, '#9e5d40');
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.roundRect(px, py, w, h, r);
        ctx.fill();
      };
      skin(hx, y + 12, handWidth, 108, handWidth * 0.24);
      for (let i = 0; i < 4; i++) {
        const px = hx + 3 + i * (handWidth / 4),
          py = y - 26 + (i % 2) * 9,
          fw = handWidth / 4 - 5;
        skin(px, py, fw, 73, fw * 0.48);
        ctx.strokeStyle = 'rgba(101,59,39,.3)';
        ctx.lineWidth = 0.8;
        for (const bend of [28, 43]) {
          ctx.beginPath();
          ctx.moveTo(px + 3, py + bend);
          ctx.quadraticCurveTo(px + fw / 2, py + bend + 2, px + fw - 3, py + bend);
          ctx.stroke();
        }
      }
      skin(hx - 10, y + 40, handWidth * 0.3, 61, 12);
      ctx.strokeStyle = 'rgba(103,59,41,.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + handWidth * 0.22, y + 51);
      ctx.bezierCurveTo(
        hx + handWidth * 0.6,
        y + 43,
        hx + handWidth * 0.7,
        y + 70,
        hx + handWidth * 0.87,
        y + 67,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + handWidth * 0.3, y + 58);
      ctx.quadraticCurveTo(hx + handWidth * 0.15, y + 91, hx + handWidth * 0.43, y + 102);
      ctx.stroke();
      skin(x - 5, y + 104, 46, 69, 15);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#fff0b5';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('DONALD TRUMP', x + 24, y + 224);
  }
}
