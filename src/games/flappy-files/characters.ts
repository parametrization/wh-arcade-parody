import { drawHead } from './heads';
import { textureRect } from '../../shared/fidelity/materials';
import { grain, litFill } from './materials';
import { CAST } from './model';

export interface CharacterOptions {
  name: string;
  x: number;
  edge: number;
  upper: boolean;
  time: number;
  eagleX: number;
  eagleY: number;
  reducedMotion: boolean;
  atlas?: HTMLImageElement;
  available?: number;
}

/** Actor allocation within the existing obstacle band; remaining stone holds its plaque. */
export const rigHeight = (available: number, upper = false) =>
  Math.min(78, Math.max(upper ? 54 : 24, available - 26));

/** Unique deterministic gestures, visual only; model collision boxes never consume these poses. */
export function swipePose(id: number, time: number, reducedMotion: boolean) {
  if (reducedMotion) return { reach: 0.12, lift: 0.1, bob: 0, twist: 0 };
  const phase = time * [2.3, 1.1, 2.8, 2, 3.1, 1.9, 2.5][id] + id * 0.83;
  return {
    reach: (Math.sin(phase) + 1) / 2,
    lift: Math.sin(phase + id * 0.6),
    bob: Math.sin(phase * 1.6) * 1.6,
    twist: Math.sin(phase + 0.7) * 0.08,
  };
}

export function drawColumnCharacter(ctx: CanvasRenderingContext2D, o: CharacterOptions) {
  const id = Math.max(0, CAST.indexOf(o.name));
  const pose = swipePose(id, o.time, o.reducedMotion);
  const facing = o.eagleX < o.x ? -1 : 1;
  const skin = ['#eea46c', '#d8ae89', '#deb18b', '#d4a784', '#e3b899', '#e4baa0', '#d9b08d'][id];
  const jacket = ['#284b7b', '#28415e', '#a32f46', '#7b2944', '#433b69', '#762c48', '#304f57'][id];
  ctx.save();
  ctx.translate(Math.round(o.x), Math.round(o.edge));
  const height = rigHeight(o.available ?? (o.upper ? o.edge : 388 - o.edge), o.upper);
  const scale = height / 90;
  ctx.scale(scale, scale);
  // Reserve the entire existing obstacle region for a body and its visible mount.
  ctx.translate(0, o.upper ? -14 : 14);
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    if (w >= 5 && h >= 5) {
      const light = ctx.createLinearGradient(x + w, y, x, y + h);
      light.addColorStop(0, 'rgba(255,230,195,.14)');
      light.addColorStop(1, 'rgba(0,7,17,.28)');
      ctx.fillStyle = light;
      ctx.fillRect(x, y, w, h);
      grain(ctx, id === 1 ? 'leather' : 'cloth', x, y, w, h, 0.16);
      textureRect(ctx, x, y, w, h, id === 1 ? 'leather' : 'wool', 0.2);
    }
  };
  const facet = (points: number[][], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]),
      x = Math.min(...xs),
      y = Math.min(...ys),
      w = Math.max(...xs) - x,
      h = Math.max(...ys) - y;
    litFill(ctx, color, x, y, w || 1, h || 1);
    ctx.save();
    ctx.clip();
    grain(ctx, 'cloth', x, y, w, h, 0.25);
    ctx.restore();
  };
  const tint = (hex: string, factor: number) =>
    `#${[1, 3, 5]
      .map((i) =>
        Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`;
  const line = (points: number[][], color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  };
  const chain = (x: number, y0: number, y1: number) => {
    for (let y = y0; y < y1; y += 6) {
      ctx.strokeStyle = '#243244';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y, 4, 6);
      ctx.strokeStyle = '#b5b8ad';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 2, y, 4, 6);
    }
  };
  function head(x: number, y: number, size: number, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    if (o.atlas) {
      const scale = size / 0.82;
      drawHead(ctx, o.atlas, id, -scale * 0.5, -size * 0.03, scale);
    } else {
      const hair = ['#efca58', '#563d30', '#553c30', '#96846c', '#d7d6c6', '#93765c', '#a2a5a0'][
        id
      ];
      rect(-size * 0.34, 0, size * 0.68, size * 0.65, skin);
      rect(-size * 0.38, -2, size * 0.74, 8, hair);
      rect(-size * 0.38, 3, 5, 20, hair);
      rect(size * 0.27, 2, 5, 18, hair);
      rect(-10, 13, 4, 3, '#172738');
      rect(7, 13, 4, 3, '#172738');
      rect(-4, 24, 11, 2, '#895744');
      if (id === 1) rect(-13, 24, 28, 8, '#674b38');
      if (id === 2 || id === 4) {
        ctx.strokeStyle = '#243648';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, 10, 13, 9);
        ctx.strokeRect(2, 10, 13, 9);
      }
    }
    ctx.restore();
  }
  function hand(x: number, y: number, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-4.8, -5, 10, 12, 3);
    litFill(ctx, skin, -5, -5, 11, 12);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.roundRect(-4.7 + i * 2.7, -10 + (i % 2), 2.1, 9, 1);
      litFill(ctx, skin, -5, -10, 11, 10);
    }
    ctx.beginPath();
    ctx.ellipse(5, 0, 2, 4, -0.55, 0, Math.PI * 2);
    litFill(ctx, skin, 3, -4, 5, 8);
    ctx.strokeStyle = '#a26f52';
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(0, 2, 3, 0);
    ctx.stroke();
    ctx.restore();
  }
  function arm(sx: number, sy: number, ex: number, ey: number, up: number) {
    const mx = (sx + ex) / 2 + facing * 5,
      my = (sy + ey) / 2 + up;
    line(
      [
        [sx, sy],
        [mx, my],
        [ex, ey],
      ],
      '#17293d',
      11,
    );
    line(
      [
        [sx, sy],
        [mx, my],
        [ex, ey],
      ],
      jacket,
      8,
    );
    line(
      [
        [sx - 1, sy - 2],
        [mx - 1, my - 2],
        [ex - 1, ey - 2],
      ],
      '#698098',
      2,
    );
    const sleeve = (a: number[], b: number[]) => {
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        len = Math.hypot(dx, dy) || 1;
      const light = ctx.createLinearGradient(
        a[0] - (dy / len) * 4,
        a[1] + (dx / len) * 4,
        a[0] + (dy / len) * 4,
        a[1] - (dx / len) * 4,
      );
      light.addColorStop(0, tint(jacket, 0.62));
      light.addColorStop(0.7, tint(jacket, 1.2));
      light.addColorStop(1, tint(jacket, 0.8));
      ctx.strokeStyle = light;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(...(a as [number, number]));
      ctx.lineTo(...(b as [number, number]));
      ctx.stroke();
    };
    sleeve([sx, sy], [mx, my]);
    sleeve([mx, my], [ex, ey]);
    ctx.strokeStyle = tint(jacket, 0.65);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(mx - 3, my);
    ctx.quadraticCurveTo(mx, my + 2, mx + 3, my);
    ctx.stroke();
    hand(ex, ey, Math.atan2(ey - my, ex - mx) + Math.PI / 2);
  }
  function couch() {
    // Vance always reclines on a Chesterfield, including the upright chain-suspended upper couch.
    const cy = o.upper ? -55 : 10;
    if (o.upper) {
      chain(-40, -76, cy + 40);
      chain(40, -76, cy + 40);
    }
    ctx.save();
    ctx.translate(0, cy);
    const upholstered = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      litFill(ctx, '#68432c', x, y, w, h);
      ctx.save();
      ctx.clip();
      textureRect(ctx, x, y, w, h, 'leather', 0.45);
      ctx.restore();
      ctx.strokeStyle = '#30261f';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    };
    upholstered(-44, 22, 90, 33, 8);
    upholstered(-38, 19, 78, 28, 7);
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 6; col++) {
        const x = -32 + col * 13 + (row % 2) * 3,
          y = 27 + row * 11;
        ctx.strokeStyle = 'rgba(24,16,13,.45)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 5);
        ctx.quadraticCurveTo(x, y - 1, x, y);
        ctx.quadraticCurveTo(x + 1, y - 1, x + 6, y - 5);
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 5);
        ctx.stroke();
        ctx.fillStyle = '#332219';
        ctx.beginPath();
        ctx.ellipse(x, y, 1.5, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    upholstered(-37, 43, 37, 10, 4);
    upholstered(1, 43, 38, 10, 4);
    upholstered(-47, 28, 14, 26, 7);
    upholstered(36, 28, 14, 26, 7);
    ctx.fillStyle = '#35261d';
    ctx.beginPath();
    ctx.roundRect(-37, 53, 79, 5, 2);
    ctx.fill();
    for (const x of [-34, 31]) {
      ctx.beginPath();
      ctx.ellipse(x, 58, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Torso sprawls across cushions; bent knees and shoes make the lounging pose unmistakable.
    line(
      [
        [-9, 31],
        [10, 39],
        [30, 36],
        [38, 46],
      ],
      '#17283f',
      13,
    );
    line(
      [
        [-9, 31],
        [10, 39],
        [30, 36],
        [38, 46],
      ],
      '#345571',
      9,
    );
    rect(34, 46, 14, 5, '#141e2b');
    ctx.beginPath();
    ctx.moveTo(-22, 27);
    ctx.bezierCurveTo(-23, 21, -14, 21, -9, 25);
    ctx.lineTo(6, 40);
    ctx.quadraticCurveTo(5, 46, -1, 47);
    ctx.lineTo(-22, 42);
    ctx.closePath();
    litFill(ctx, jacket, -23, 22, 30, 25);
    ctx.save();
    ctx.clip();
    textureRect(ctx, -23, 22, 30, 25, 'wool', 0.3);
    ctx.restore();
    rect(-18, 28, 8, 15, '#dae3d9');
    rect(-12, 28, 4, 18, '#326191');
    const reach = facing * (20 + pose.reach * 26);
    arm(-13, 30, reach, (o.upper ? 62 : -7) - pose.lift * 8, -4);
    head(-19 + pose.bob, o.upper ? -10 : -20, 43, -0.2 + pose.twist * 0.3);
    ctx.restore();
    return;
  }
  if (id === 1) {
    couch();
    ctx.restore();
    return;
  }
  const base = o.upper ? -76 : 0;
  if (o.upper) {
    chain(-9, -76, -68);
    chain(9, -76, -68);
  }
  ctx.save();
  ctx.translate(0, base);
  if (o.upper) {
    ctx.translate(0, 76);
    ctx.scale(1, -1);
  }
  // Capital shelf bears visible shoes; inverted upper characters hang from strapped ankles.
  for (const x of [-10, 10]) {
    ctx.beginPath();
    ctx.moveTo(x - 5, 50);
    ctx.quadraticCurveTo(x - 6, 58, x - 4, 63);
    ctx.lineTo(x - 4, 70);
    ctx.lineTo(x + 4, 70);
    ctx.quadraticCurveTo(x + 6, 57, x + 5, 50);
    ctx.closePath();
    litFill(ctx, jacket, x - 6, 50, 12, 21);
    ctx.strokeStyle = tint(jacket, 0.7);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - 2, 52);
    ctx.quadraticCurveTo(x + 1, 61, x - 1, 68);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5, 69);
    ctx.quadraticCurveTo(x + 4, 67, x + 9, 72);
    ctx.quadraticCurveTo(x + 9, 75, x - 6, 74);
    ctx.closePath();
    litFill(ctx, '#20252a', x - 6, 68, 15, 7);
  }
  if (o.upper) {
    rect(-15, 69, 13, 4, '#ac8151');
    rect(3, 69, 13, 4, '#ac8151');
  }
  ctx.beginPath();
  ctx.moveTo(-8, 30);
  ctx.bezierCurveTo(-18, 29, -20, 34, -19, 42);
  ctx.lineTo(-17, 59);
  ctx.quadraticCurveTo(-4, 61, 0, 57);
  ctx.quadraticCurveTo(9, 60, 18, 58);
  ctx.lineTo(19, 39);
  ctx.bezierCurveTo(19, 31, 11, 30, 7, 30);
  ctx.closePath();
  litFill(ctx, jacket, -20, 29, 40, 33);
  ctx.save();
  ctx.clip();
  textureRect(ctx, -20, 29, 40, 33, 'wool', 0.32);
  ctx.restore();
  ctx.strokeStyle = tint(jacket, 0.65);
  ctx.lineWidth = 0.65;
  for (const [px, py] of [
    [-13, 42],
    [-9, 51],
    [11, 43],
    [12, 54],
  ]) {
    ctx.beginPath();
    ctx.moveTo(px - 3, py);
    ctx.quadraticCurveTo(px, py + 1, px + 3, py - 1);
    ctx.stroke();
  }
  rect(-6, 31, 12, 19, '#f3e5d0');
  rect(-1, 35, 4, id === 0 ? 29 : 19, id === 4 ? '#398263' : '#c74d50');
  rect(-3, 32, 8, 5, '#e9d2b1');
  // Torso faces and sharply folded lapels: directional lighting, not a new silhouette.
  facet(
    [
      [-17, 31],
      [-8, 30],
      [-5, 43],
      [-12, 48],
      [-17, 44],
    ],
    tint(jacket, 1.45),
  );
  facet(
    [
      [7, 31],
      [17, 34],
      [17, 56],
      [10, 57],
      [10, 43],
    ],
    tint(jacket, 0.64),
  );
  facet(
    [
      [-8, 31],
      [-3, 35],
      [-1, 47],
      [-8, 42],
    ],
    tint(jacket, 0.73),
  );
  facet(
    [
      [5, 31],
      [10, 32],
      [8, 44],
      [3, 49],
    ],
    tint(jacket, 0.86),
  );
  const reach = 21 + pose.reach * 26,
    targetY = ((o.upper ? -1 : 1) * (o.eagleY - o.edge)) / scale - 14;
  const desired = Math.max(-25, Math.min(55, targetY));
  if (id === 0) {
    arm(-15, 36, facing * reach, desired - 8, -8);
    arm(15, 37, facing * (reach + 7), desired + 7, 5);
  }
  if (id === 2) {
    arm(-15, 36, facing * reach, desired, -6);
    arm(15, 37, facing * (reach - 5), desired + 10, 2);
    ctx.save();
    ctx.translate(facing * (reach + 5), desired);
    ctx.rotate(pose.twist * 3);
    rect(-8, -13, 17, 24, '#a99c7c');
    rect(-7, -14, 16, 22, '#f4e9c9');
    for (let i = 0; i < 4; i++) rect(-4, -10 + i * 4, 10, 1, '#7d7d73');
    ctx.restore();
  }
  if (id === 3) {
    const angle = o.reducedMotion ? -0.7 : o.time * 2;
    arm(-15, 37, -15 + Math.cos(angle) * 29, 37 + Math.sin(angle) * 24, -5);
    arm(15, 37, 15 + Math.cos(angle + Math.PI) * 29, 37 + Math.sin(angle + Math.PI) * 24, 5);
  }
  if (id === 4) {
    arm(-15, 38, -24, 47, 3);
    arm(15, 37, facing * reach, desired, -6);
    ctx.save();
    ctx.translate(facing * (reach + 3), desired);
    ctx.rotate(pose.twist * 4);
    rect(-9, -12, 18, 23, '#223d38');
    rect(-6, -10, 14, 19, '#d5d1b0');
    for (let i = 0; i < 5; i++) rect(-4, -8 + i * 3, 10, 1, '#6e9071');
    ctx.restore();
  }
  if (id === 5) {
    arm(-15, 37, -24, 52, 3);
    arm(15, 36, facing * reach, desired, -9);
    rect(facing * reach + (facing < 0 ? -13 : 3), desired - 9, 12, 3, skin);
  }
  if (id === 6) {
    const angle = o.reducedMotion ? -0.8 : o.time * 2.5;
    arm(-15, 38, -24, 52, 3);
    arm(15, 35, Math.cos(angle) * 32, 19 + Math.sin(angle) * 22, -12);
  }
  head(pose.bob * 0.4, -11 + pose.bob, 48, pose.twist);
  ctx.restore();
  ctx.restore();
}
