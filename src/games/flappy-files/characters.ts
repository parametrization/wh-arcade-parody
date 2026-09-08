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

// Normalized anatomical head outlines in each atlas cell. No navy rectangular tile remains.
const headOutlines: number[][][] = [
  [
    [0.16, 0.22],
    [0.2, 0.13],
    [0.34, 0.07],
    [0.54, 0.05],
    [0.78, 0.07],
    [0.84, 0.16],
    [0.76, 0.24],
    [0.78, 0.43],
    [0.73, 0.61],
    [0.6, 0.72],
    [0.42, 0.72],
    [0.27, 0.64],
    [0.18, 0.53],
    [0.13, 0.38],
  ],
  [
    [0.17, 0.24],
    [0.23, 0.12],
    [0.45, 0.04],
    [0.68, 0.07],
    [0.79, 0.17],
    [0.79, 0.38],
    [0.74, 0.57],
    [0.67, 0.69],
    [0.51, 0.77],
    [0.34, 0.7],
    [0.24, 0.59],
    [0.18, 0.43],
  ],
  [
    [0.17, 0.21],
    [0.31, 0.11],
    [0.53, 0.07],
    [0.7, 0.09],
    [0.8, 0.22],
    [0.8, 0.49],
    [0.68, 0.68],
    [0.5, 0.74],
    [0.34, 0.66],
    [0.23, 0.55],
    [0.17, 0.37],
  ],
  [
    [0.21, 0.18],
    [0.33, 0.08],
    [0.57, 0.04],
    [0.71, 0.1],
    [0.77, 0.22],
    [0.78, 0.5],
    [0.66, 0.71],
    [0.49, 0.78],
    [0.35, 0.68],
    [0.27, 0.54],
    [0.2, 0.36],
  ],
  [
    [0.18, 0.18],
    [0.31, 0.07],
    [0.5, 0.03],
    [0.68, 0.08],
    [0.78, 0.18],
    [0.79, 0.43],
    [0.71, 0.61],
    [0.55, 0.74],
    [0.38, 0.72],
    [0.25, 0.58],
    [0.18, 0.4],
  ],
  [
    [0.16, 0.26],
    [0.21, 0.15],
    [0.36, 0.08],
    [0.58, 0.06],
    [0.76, 0.14],
    [0.79, 0.3],
    [0.78, 0.49],
    [0.68, 0.67],
    [0.51, 0.77],
    [0.35, 0.7],
    [0.24, 0.57],
    [0.18, 0.42],
  ],
  [
    [0.13, 0.22],
    [0.23, 0.12],
    [0.35, 0.05],
    [0.49, 0.08],
    [0.64, 0.04],
    [0.77, 0.12],
    [0.83, 0.25],
    [0.8, 0.47],
    [0.7, 0.64],
    [0.51, 0.75],
    [0.35, 0.7],
    [0.23, 0.57],
    [0.16, 0.4],
  ],
];

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
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const facet = (points: number[][], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  };
  const tint = (hex: string, factor: number) =>
    `#${[1, 3, 5]
      .map((i) =>
        Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`;
  const limbMesh = (a: number[], b: number[], width: number) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      length = Math.hypot(dx, dy) || 1,
      nx = ((-dy / length) * width) / 2,
      ny = ((dx / length) * width) / 2;
    facet(
      [
        [a[0] - nx, a[1] - ny],
        [b[0] - nx, b[1] - ny],
        [b[0], b[1]],
        [a[0], a[1]],
      ],
      tint(jacket, 1.38),
    );
    facet(
      [
        [a[0], a[1]],
        [b[0], b[1]],
        [b[0] + nx, b[1] + ny],
        [a[0] + nx, a[1] + ny],
      ],
      tint(jacket, 0.78),
    );
  };
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
      const cw = o.atlas.naturalWidth / 4,
        ch = o.atlas.naturalHeight / 2,
        sx = Math.round((id % 4) * cw),
        sy = Math.round(Math.floor(id / 4) * ch),
        ex = Math.round(((id % 4) + 1) * cw),
        ey = Math.round((Math.floor(id / 4) + 1) * ch);
      // Map the normalized cell into an oversized head. The crop excludes torso/tie.
      const ox = -size * 0.5,
        oy = -size * 0.08,
        scale = size / 0.76;
      ctx.beginPath();
      headOutlines[id].forEach(([a, b], i) =>
        i ? ctx.lineTo(ox + a * scale, oy + b * scale) : ctx.moveTo(ox + a * scale, oy + b * scale),
      );
      ctx.closePath();
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(o.atlas, sx, sy, ex - sx, ey - sy, ox, oy, scale, scale);
      // Keep each likeness as a texture while broad lighting planes suggest modeled cheeks.
      facet(
        [
          [ox + scale * 0.2, oy + scale * 0.2],
          [ox + scale * 0.5, oy + scale * 0.09],
          [ox + scale * 0.65, oy + scale * 0.25],
          [ox + scale * 0.36, oy + scale * 0.32],
        ],
        'rgba(255,238,207,.09)',
      );
      facet(
        [
          [ox + scale * 0.64, oy + scale * 0.29],
          [ox + scale * 0.81, oy + scale * 0.35],
          [ox + scale * 0.7, oy + scale * 0.62],
          [ox + scale * 0.55, oy + scale * 0.72],
        ],
        'rgba(33,39,61,.12)',
      );
      facet(
        [
          [ox + scale * 0.27, oy + scale * 0.43],
          [ox + scale * 0.42, oy + scale * 0.48],
          [ox + scale * 0.38, oy + scale * 0.68],
          [ox + scale * 0.24, oy + scale * 0.58],
        ],
        'rgba(255,226,191,.06)',
      );
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
    rect(-5, -5, 11, 12, '#774d3e');
    rect(-4, -5, 9, 10, skin);
    for (let i = 0; i < 4; i++) rect(-5 + i * 3, -10 + (i % 2), 2, 8, '#f0c59b');
    rect(4, -1, 5, 3, skin);
    rect(-3, 1, 7, 1, '#b98060');
    facet(
      [
        [-4, -4],
        [1, -5],
        [4, -1],
        [1, 4],
        [-4, 2],
      ],
      tint(skin, 1.1),
    );
    facet(
      [
        [1, 4],
        [4, -1],
        [5, 5],
        [1, 6],
      ],
      tint(skin, 0.75),
    );
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
    limbMesh([sx, sy], [mx, my], 8);
    limbMesh([mx, my], [ex, ey], 8);
    facet(
      [
        [mx - 4, my - 2],
        [mx, my - 5],
        [mx + 4, my - 1],
        [mx + 2, my + 4],
        [mx - 3, my + 3],
      ],
      tint(jacket, 0.92),
    );
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
    rect(-44, 28, 91, 28, '#301b1c');
    rect(-40, 20, 82, 27, '#593020');
    rect(-38, 22, 78, 21, '#8a4c2c');
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 6; col++) {
        const x = -33 + col * 13 + (row % 2) * 4,
          y = 27 + row * 10;
        line(
          [
            [x - 5, y - 4],
            [x, y],
            [x + 5, y - 4],
          ],
          '#ab7043',
          1,
        );
        rect(x - 1, y - 1, 3, 3, '#3a211d');
      }
    rect(-37, 44, 76, 10, '#aa6739');
    rect(-35, 46, 33, 6, '#815031');
    rect(2, 46, 34, 6, '#815031');
    for (const x of [-47, 37]) {
      rect(x, 34, 13, 20, '#48261d');
      rect(x + 2, 30, 9, 20, '#9b5a33');
      rect(x + 3, 31, 5, 3, '#d29155');
    }
    // Upholstered volume, raised rolled arms and a shaded wooden plinth.
    facet(
      [
        [-44, 28],
        [-38, 23],
        [-38, 45],
        [-44, 52],
      ],
      '#9c6540',
    );
    facet(
      [
        [42, 23],
        [49, 28],
        [49, 51],
        [42, 56],
      ],
      '#39231f',
    );
    facet(
      [
        [-37, 44],
        [-30, 39],
        [35, 39],
        [39, 44],
      ],
      '#bd8150',
    );
    facet(
      [
        [-40, 53],
        [44, 53],
        [39, 58],
        [-35, 58],
      ],
      '#3e2921',
    );
    rect(-35, 54, 8, 7, '#312523');
    rect(28, 54, 8, 7, '#312523');
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
    rect(-23, 24, 28, 22, jacket);
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
  rect(-18, 69, 15, 6, '#172334');
  rect(4, 69, 16, 6, '#172334');
  facet(
    [
      [-18, 69],
      [-12, 66],
      [-3, 69],
      [-3, 73],
      [-18, 73],
    ],
    '#344252',
  );
  facet(
    [
      [4, 69],
      [10, 66],
      [20, 69],
      [20, 73],
      [4, 73],
    ],
    '#344252',
  );
  rect(-14, 51, 10, 19, jacket);
  rect(5, 51, 10, 19, jacket);
  rect(-13, 52, 2, 15, '#66758a');
  if (o.upper) {
    rect(-15, 69, 13, 4, '#ac8151');
    rect(3, 69, 13, 4, '#ac8151');
  }
  rect(-19, 30, 38, 29, '#172b43');
  rect(-17, 31, 34, 26, jacket);
  rect(-16, 33, 7, 22, '#64778e');
  rect(11, 33, 5, 22, '#1d3149');
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
  facet(
    [
      [-14, 52],
      [-8, 51],
      [-6, 69],
      [-13, 68],
    ],
    tint(jacket, 1.2),
  );
  facet(
    [
      [10, 52],
      [15, 53],
      [14, 69],
      [10, 69],
    ],
    tint(jacket, 0.7),
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
