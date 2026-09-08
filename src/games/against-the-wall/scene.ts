import {
  MAP_WIDTH,
  MAP_HEIGHT,
  tunnelCandidates,
  isNight,
  canDistract,
  type State,
  type Actor,
} from './model';
import { visionBoundary, DISTRACTION_RANGE } from './visibility';

type V = { x: number; y: number; z: number };
type Mesh = { p: V[]; color: string; depth: number };
const distance = 16;
const focal = 1000;
/** Perspective camera axes are orthogonal; input rays meet the simulation ground plane. */
export function unprojectScene(s: State, x: number, y: number) {
  const sy = y - 360;
  const dy = (distance * sy) / (focal * 0.73 + sy * 0.68);
  const d = distance - dy * 0.68;
  return { x: s.x + ((x - 480) * d) / focal, y: s.y + dy };
}
export function projectScene(s: State, x: number, y: number, z = 0) {
  const d = Math.max(1, distance - (y - s.y) * 0.68 - z * 0.73);
  return { x: 480 + ((x - s.x) * focal) / d, y: 360 + (((y - s.y) * 0.73 - z * 0.68) * focal) / d };
}
export function drawScene(
  c: CanvasRenderingContext2D,
  s: State,
  aim: { x: number; y: number } | null,
  variant: string,
  reducedMotion: boolean,
  tunnelCursor: { x: number; y: number } | null = null,
) {
  c.save();
  const night = isNight(s);
  const depth = (p: V) => distance - (p.y - s.y) * 0.68 - p.z * 0.73;
  const project = (p: V) => projectScene(s, p.x, p.y, p.z);
  const v = (x: number, y: number, z = 0): V => ({ x, y, z });
  const floor: Mesh[] = [],
    meshes: Mesh[] = [];
  const face = (p: V[], color: string, ground = false) => {
    if (p.some((p) => depth(p) < 1)) return;
    (ground ? floor : meshes).push({
      p,
      color,
      depth: p.reduce((n, p) => n + depth(p), 0) / p.length,
    });
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    base: string,
    top: string,
    side: string,
  ) => {
    face([v(x, y, z + h), v(x + w, y, z + h), v(x + w, y + d, z + h), v(x, y + d, z + h)], top);
    face([v(x, y, z), v(x + w, y, z), v(x + w, y, z + h), v(x, y, z + h)], side);
    face([v(x, y + d, z), v(x + w, y + d, z), v(x + w, y + d, z + h), v(x, y + d, z + h)], base);
    for (const xx of [x, x + w])
      face([v(xx, y, z), v(xx, y + d, z), v(xx, y + d, z + h), v(xx, y, z + h)], side);
  };
  const beam = (a: V, b: V, width: number, color: string) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1,
      ox = (-(b.y - a.y) / d) * width,
      oy = ((b.x - a.x) / d) * width;
    face(
      [
        v(a.x + ox, a.y + oy, a.z),
        v(b.x + ox, b.y + oy, b.z),
        v(b.x - ox, b.y - oy, b.z),
        v(a.x - ox, a.y - oy, a.z),
      ],
      color,
    );
    // Crossed strip gives wire and limbs a silhouette from either view angle.
    face(
      [
        v(a.x, a.y, a.z + width),
        v(b.x, b.y, b.z + width),
        v(b.x, b.y, b.z - width),
        v(a.x, a.y, a.z - width),
      ],
      color,
    );
  };
  const labels: { p: V; text: string; color: string }[] = [];
  const sky = c.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, variant === 'C' ? '#435773' : '#6c8b9b');
  sky.addColorStop(0.65, '#c6bfa4');
  sky.addColorStop(1, '#a89575');
  c.fillStyle = sky;
  c.fillRect(0, 0, 960, 640);
  for (let layer = 0; layer < 4; layer++) {
    c.fillStyle = ['#9ca8a1', '#929b8e', '#7e8b7c', '#68796a'][layer];
    c.beginPath();
    c.moveTo(0, 640);
    for (let x = -80; x <= 1040; x += 80)
      c.lineTo(x, 95 + layer * 58 + Math.sin(x * 0.012 + layer) * 30 + (x % 160 === 0 ? 20 : 0));
    c.lineTo(960, 640);
    c.fill();
  }
  const barrierKeys = new Set(s.barriers.map((b) => `${b.x},${b.y}`));
  for (let y = 0; y < MAP_HEIGHT; y++)
    for (let x = 0; x < MAP_WIDTH; x++) {
      const p = project(v(x + 0.5, y + 0.5));
      if (p.x < -130 || p.x > 1090 || p.y < -180 || p.y > 850) continue;
      const seed = (x * 31 + y * 17) % 9;
      const color = [
        '#ac9e7e',
        '#ad9f80',
        '#ae9f7f',
        '#b1a282',
        '#aa9c7a',
        '#ad9e7d',
        '#afa180',
        '#ab9e7d',
        '#b0a181',
      ][seed];
      face([v(x, y), v(x + 1, y), v(x + 1, y + 1)], color, true);
      face([v(x, y), v(x + 1, y + 1), v(x, y + 1)], color, true);
      if (s.walls.has(`${x},${y}`) && !barrierKeys.has(`${x},${y}`)) {
        box(x, y, 0, 1, 1, 0.85, '#a49780', '#d0c1a1', '#8c8471');
        for (let k = 1; k <= 2; k++)
          beam(v(x, y + 1.005, k * 0.27), v(x + 1, y + 1.005, k * 0.27), 0.012, '#756f62');
      } else if (seed === 0 && !barrierKeys.has(`${x},${y}`)) {
        const xx = x + 0.17,
          yy = y + 0.2;
        face(
          [v(xx - 0.13, yy), v(xx + 0.14, yy - 0.08), v(xx + 0.1, yy + 0.16)],
          '#847c6344',
          true,
        );
        face([v(xx - 0.1, yy), v(xx, yy - 0.1, 0.13), v(xx + 0.12, yy + 0.07)], '#8d8770');
        face([v(xx, yy - 0.1, 0.13), v(xx + 0.12, yy + 0.07), v(xx + 0.1, yy + 0.14)], '#b1ab8d');
        for (let k = 0; k < 3; k++)
          face(
            [
              v(x + 0.72, y + 0.8),
              v(x + 0.67 + k * 0.06, y + 0.8, 0.2 + k * 0.05),
              v(x + 0.8, y + 0.84),
            ],
            '#778366',
          );
      }
    }
  for (const b of s.barriers) {
    const { x, y } = b;
    const screen = project(v(x + 0.5, y + 0.5));
    if (screen.x < -160 || screen.x > 1120 || screen.y < -150 || screen.y > 1000) continue;
    if (b.repairProgress > 0)
      labels.push({
        p: v(x + 0.5, y + 0.5, 1.4),
        text: `MENDING ${Math.ceil(30 - b.repairProgress)}s`,
        color: '#ffb58f',
      });
    const height = b.material === 'wire' ? 0.9 : b.material === 'fence' ? 1.65 : 1.85;
    if (b.material === 'concrete') {
      if (b.open) {
        // Open tunnel is a genuine gap between piers, with a heavy lintel overhead.
        box(x, y, 0, 0.16, 1, height, '#9da294', '#c3c7b3', '#767f78');
        box(x + 0.84, y, 0, 0.16, 1, height, '#9da294', '#c3c7b3', '#767f78');
        box(x + 0.16, y, 0.65, 0.68, 1, height - 0.65, '#9da294', '#c3c7b3', '#767f78');
        face(
          [
            v(x + 0.16, y + 1, 0.65),
            v(x + 0.3, y + 1, 0.82),
            v(x + 0.7, y + 1, 0.82),
            v(x + 0.84, y + 1, 0.65),
          ],
          '#555f58',
        );
        labels.push({ p: v(x + 0.5, y + 1.1, 0.85), text: 'TUNNEL', color: '#dce7cb' });
      } else box(x, y, 0, 1, 1, height, '#a6aa9a', '#d4d4bb', '#858f83');
      for (const z of [0.5, 1, 1.5])
        beam(v(x + 0.03, y + 1.005, z), v(x + 0.97, y + 1.005, z), 0.013, '#778176');
      box(x + 0.05, y + 0.1, height, 0.9, 0.8, 0.09, '#b3b6a4', '#e0ddc4', '#909a8b');
    } else {
      for (const px of [x + 0.05, x + 0.95]) {
        box(px - 0.025, y + 0.48, 0, 0.05, 0.05, height, '#7a8883', '#bfcbc1', '#526662');
        beam(v(px, y + 0.5, height), v(px, y + 0.35, height + 0.16), 0.02, '#879b93');
      }
      if (b.material === 'wire') {
        for (let k = 0; k < 4; k++) {
          const z = 0.17 + k * 0.2;
          if (b.open) {
            beam(v(x + 0.05, y + 0.5, z), v(x + 0.25, y + 0.62, z * 0.5), 0.014, '#a5b2a5');
            beam(v(x + 0.8, y + 0.4, z * 0.6), v(x + 0.95, y + 0.5, z), 0.014, '#a5b2a5');
          } else {
            beam(v(x + 0.05, y + 0.5, z), v(x + 0.95, y + 0.5, z), 0.012, '#c0c5af');
            for (let j = 1; j < 5; j++) {
              const xx = x + j * 0.2;
              beam(
                v(xx - 0.04, y + 0.47, z - 0.035),
                v(xx + 0.04, y + 0.53, z + 0.035),
                0.008,
                '#566d66',
              );
            }
          }
        }
      } else {
        for (let k = 0; k <= 7; k++) {
          const xx = x + k / 7;
          beam(v(xx, y + 0.5, 0), v(Math.min(x + 1, xx + 0.4), y + 0.5, height), 0.009, '#a2b1a6');
          beam(v(xx, y + 0.5, height), v(Math.min(x + 1, xx + 0.4), y + 0.5, 0), 0.009, '#758d84');
        }
        if (b.open) {
          for (const xx of [x + 0.28, x + 0.72])
            beam(v(xx, y + 1, 0), v(xx, y + 0.45, height + 0.1), 0.035, '#d8b77b');
          for (let k = 0; k < 7; k++) {
            const q = k / 6;
            beam(
              v(x + 0.28, y + 1 - q * 0.55, q * (height + 0.1)),
              v(x + 0.72, y + 1 - q * 0.55, q * (height + 0.1)),
              0.025,
              '#e6cf94',
            );
          }
          labels.push({
            p: v(x + 0.5, y + 0.5, height + 0.35),
            text: `LADDER ${Math.ceil(b.remaining)}s`,
            color: '#fff0b3',
          });
        }
      }
      // Short segmented coils create actual raised razor-wire geometry.
      if (!b.open)
        for (let j = 0; j < 4; j++)
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4,
              aa = ((k + 1) * Math.PI) / 4;
            beam(
              v(
                x + 0.15 + j * 0.22 + Math.cos(a) * 0.11,
                y + 0.5 + Math.sin(a) * 0.09,
                height + 0.08 + Math.sin(a) * 0.11,
              ),
              v(
                x + 0.15 + j * 0.22 + Math.cos(aa) * 0.11,
                y + 0.5 + Math.sin(aa) * 0.09,
                height + 0.08 + Math.sin(aa) * 0.11,
              ),
              0.006,
              '#a7b9ae',
            );
          }
    }
    if (b.progress > 0 && !b.open)
      labels.push({
        p: v(x + 0.5, y + 0.7, height + 0.2),
        text: `${Math.round(b.progress * 100)}%`,
        color: '#ffe5a1',
      });
  }
  // Tunnel portals occupy selected walkable bank cells; the concrete above stays solid.
  for (const tunnel of s.tunnels) {
    if (!tunnel.open) continue;
    for (const point of [tunnel.entrance, tunnel.exit]) {
      const { x, y } = point;
      face(
        [
          v(x - 0.38, y - 0.35, 0.02),
          v(x + 0.38, y - 0.35, 0.02),
          v(x + 0.38, y + 0.35, 0.02),
          v(x - 0.38, y + 0.35, 0.02),
        ],
        '#15202a',
        true,
      );
      for (const side of [-1, 1])
        box(x + side * 0.36 - 0.045, y - 0.35, 0, 0.09, 0.7, 0.12, '#af8c63', '#d7b17d', '#695c45');
      beam(v(x - 0.36, y - 0.35, 0.12), v(x + 0.36, y - 0.35, 0.12), 0.05, '#b69969');
      labels.push({
        p: v(x, y + 0.75, 0.08),
        text:
          tunnel.repairProgress > 0
            ? `SEALING ${Math.ceil(90 - tunnel.repairProgress)}s`
            : 'TUNNEL · STEP IN',
        color: '#dbcb9b',
      });
    }
  }
  if (s.tunnelPlacement) {
    for (const side of ['south', 'north'] as const) {
      for (const p of tunnelCandidates(s, side)) {
        const selected =
          tunnelCursor && Math.hypot(p.x - tunnelCursor.x, p.y - tunnelCursor.y) < 0.1;
        const color = selected ? '#ffe59b' : side === 'south' ? '#93f5d0' : '#89baff';
        const x = p.x,
          y = p.y,
          r = 0.42,
          t = 0.04;
        for (const [ax, ay, bx, by] of [
          [x - r, y - r, x + r, y - r],
          [x + r, y - r, x + r, y + r],
          [x + r, y + r, x - r, y + r],
          [x - r, y + r, x - r, y - r],
        ]) {
          face(
            [
              v(ax - t, ay - t, 0.06),
              v(bx + t, by - t, 0.06),
              v(bx + t, by + t, 0.06),
              v(ax - t, ay + t, 0.06),
            ],
            color,
            true,
          );
        }
      }
    }
  }
  // Detection fan is the exact model ray mesh, including narrow wall-corner gaps.
  for (const e of s.enemies) {
    if (e.state === 'dead') continue;
    const boundary = visionBoundary(s, e);
    face(
      [v(e.x, e.y, 0.025), ...boundary.map((p) => v(p.x, p.y, 0.025))],
      night ? '#f4edaa85' : e.meter > 0 ? '#e8b26750' : '#b7d8a630',
      true,
    );
  }
  // Welcoming office sits on its real model destination, with a portico and lit glazing.
  const ox = s.office.x,
    oy = s.office.y;
  box(ox - 1.15, oy - 0.8, 0, 2.3, 1.3, 1.7, '#c3c9b3', '#e4dfc2', '#8fa499');
  face(
    [
      v(ox - 1.35, oy - 0.9, 1.7),
      v(ox, oy - 0.9, 2.18),
      v(ox + 1.35, oy - 0.9, 1.7),
      v(ox + 1.35, oy + 0.65, 1.7),
      v(ox, oy + 0.65, 2.18),
      v(ox - 1.35, oy + 0.65, 1.7),
    ],
    '#688e85',
  );
  box(ox - 0.27, oy + 0.51, 0, 0.54, 0.025, 1.05, '#7bbf9f', '#b8e8bd', '#406f65');
  for (const side of [-1, 1]) {
    face(
      [
        v(ox + side * 0.72 - 0.22, oy + 0.512, 0.65),
        v(ox + side * 0.72 + 0.22, oy + 0.512, 0.65),
        v(ox + side * 0.72 + 0.22, oy + 0.512, 1.28),
        v(ox + side * 0.72 - 0.22, oy + 0.512, 1.28),
      ],
      '#eadca1',
    );
    beam(
      v(ox + side * 0.72, oy + 0.52, 0.65),
      v(ox + side * 0.72, oy + 0.52, 1.28),
      0.02,
      '#667e76',
    );
    box(ox + side * 0.95 - 0.025, oy + 0.75, 0, 0.05, 0.05, 1.42, '#b9cbbb', '#e2ddbe', '#869e94');
  }
  box(ox - 1.15, oy + 0.48, 1.4, 2.3, 0.45, 0.1, '#638e80', '#a4c3a2', '#587b72');
  beam(v(ox + 1.35, oy, 0), v(ox + 1.35, oy, 2.25), 0.023, '#bbc8b7');
  face(
    [v(ox + 1.35, oy, 2.25), v(ox + 1.95, oy, 2.2), v(ox + 1.9, oy, 1.9), v(ox + 1.35, oy, 1.95)],
    '#b3dca8',
  );
  labels.push({ p: v(ox, oy + 0.6, 2.33), text: 'ASYLUM OFFICE', color: '#d9f4ca' });
  const person = (
    x: number,
    y: number,
    heading: number,
    gait: number,
    coat: string,
    skin: string,
    player: boolean,
    dead: boolean,
    climb = false,
    crawl = false,
  ) => {
    const cs = Math.cos(heading),
      sn = Math.sin(heading);
    const ground = climb ? Math.sin((y - Math.floor(y)) * Math.PI) * 1.75 : 0;
    const local = (a: number, b: number, h: number) =>
      v(x + a * cs - b * sn, y + a * sn + b * cs, ground + h);
    const cube = (
      a: number,
      b: number,
      h: number,
      w: number,
      d: number,
      t: number,
      color: string,
      light: string,
    ) => {
      face(
        [
          local(a, b, h + t),
          local(a + w, b, h + t),
          local(a + w, b + d, h + t),
          local(a, b + d, h + t),
        ],
        light,
      );
      for (const q of [
        [a, b, a + w, b],
        [a + w, b, a + w, b + d],
        [a + w, b + d, a, b + d],
        [a, b + d, a, b],
      ])
        face(
          [
            local(q[0], q[1], h),
            local(q[2], q[3], h),
            local(q[2], q[3], h + t),
            local(q[0], q[1], h + t),
          ],
          color,
        );
    };
    face(
      [
        v(x - 0.28, y - 0.2, 0.012),
        v(x + 0.32, y - 0.2, 0.012),
        v(x + 0.36, y + 0.25, 0.012),
        v(x - 0.25, y + 0.24, 0.012),
      ],
      '#46534745',
      true,
    );
    if (dead) {
      cube(-0.32, -0.17, 0.025, 0.65, 0.34, 0.13, coat, '#8c9787');
      cube(0.32, -0.11, 0.035, 0.2, 0.22, 0.13, skin, '#e0bb97');
      for (const side of [-1, 1])
        cube(-0.63, side * 0.1 - 0.045, 0.02, 0.32, 0.09, 0.08, '#3b4d5c', '#627381');
      return;
    }
    if (crawl) {
      cube(-0.22, -0.17, 0.2, 0.55, 0.34, 0.2, coat, '#aec7b2');
      cube(0.31, -0.11, 0.22, 0.24, 0.22, 0.22, skin, '#dfb593');
      for (const side of [-1, 1]) {
        cube(-0.48 + gait, -0.04 + side * 0.13, 0.03, 0.3, 0.09, 0.15, '#3b4d5c', '#64737a');
        cube(0.12 - gait, side * 0.23 - 0.04, 0.035, 0.16, 0.09, 0.2, skin, '#dabc99');
      }
      return;
    }
    for (const side of [-1, 1]) {
      const step = side * gait;
      beam(
        local(step, side * 0.115, 0.035),
        local(-step * 0.5, side * 0.115, 0.43),
        0.075,
        '#40586c',
      );
      cube(step - 0.08, side * 0.115 - 0.055, 0.015, 0.24, 0.11, 0.085, '#283b48', '#60747a');
      beam(
        local(-step, side * 0.25, climb ? 0.88 : 0.39),
        local(step * 0.5, side * 0.21, 0.76),
        0.057,
        coat,
      );
      cube(-step - 0.035, side * 0.25 - 0.05, climb ? 0.86 : 0.32, 0.12, 0.1, 0.1, skin, '#e1bd98');
    }
    cube(-0.14, -0.18, 0.39, 0.29, 0.36, 0.4, coat, '#b8c9b6');
    // Lapels and belt are separate surfaces rather than flat front-facing decals.
    face(
      [local(0.152, -0.16, 0.77), local(0.152, -0.025, 0.68), local(0.152, -0.08, 0.56)],
      '#d9d4b8',
    );
    face(
      [local(0.152, 0.16, 0.77), local(0.152, 0.025, 0.68), local(0.152, 0.08, 0.56)],
      '#aec0b5',
    );
    cube(-0.145, -0.185, 0.4, 0.3, 0.37, 0.04, '#38483f', '#6b7662');
    cube(-0.065, -0.065, 0.78, 0.13, 0.13, 0.08, skin, '#ddb68e');
    cube(-0.11, -0.115, 0.83, 0.24, 0.23, 0.26, skin, '#e5c29c');
    face([local(0.14, -0.115, 0.91), local(0.19, 0, 0.9), local(0.14, 0.03, 0.88)], '#b27f60');
    for (const side of [-1, 1])
      face(
        [
          local(0.132, side * 0.067 - 0.018, 1.01),
          local(0.132, side * 0.067 + 0.018, 1.01),
          local(0.132, side * 0.067 + 0.018, 0.977),
          local(0.132, side * 0.067 - 0.018, 0.977),
        ],
        '#243846',
      );
    if (player) {
      cube(-0.25, -0.14, 0.44, 0.13, 0.28, 0.28, '#8c7853', '#c4ac78');
      cube(-0.12, -0.125, 1.065, 0.24, 0.25, 0.08, '#48372d', '#765b43');
    } else {
      cube(-0.13, -0.13, 1.075, 0.27, 0.26, 0.07, coat, '#b4c4ad');
      cube(0.05, -0.145, 1.065, 0.18, 0.29, 0.022, '#455c5b', '#829584');
      cube(0.145, -0.16, 0.64, 0.02, 0.1, 0.055, '#bdb48a', '#ddd2a5');
    }
  };
  const cast = [...s.enemies.map((e) => ({ x: e.x, y: e.y, e })), { x: s.x, y: s.y, e: null }];
  if (!s.companion.helped)
    person(s.companion.x, s.companion.y, Math.PI / 2, 0, '#c8a064', '#cb9e7d', true, false);
  for (const actor of cast) {
    const e: Actor | null = actor.e,
      player = !e;
    if (player && s.tunnelTransit) continue;
    const heading = e?.heading ?? s.heading;
    const gait =
      !reducedMotion && (e?.moving ?? s.moving)
        ? Math.sin((e?.walkDistance ?? s.walkDistance) * 10) * 0.12
        : 0;
    const coat = player
      ? '#4aaea3'
      : e!.faction === 'Cartel'
        ? '#987082'
        : e!.faction === 'Paramilitary'
          ? '#8c9384'
          : e!.faction === 'ICE'
            ? '#567a9a'
            : '#7b946f';
    person(
      actor.x,
      actor.y,
      heading,
      gait,
      coat,
      player ? '#bd8b68' : '#d2a27e',
      player,
      e?.state === 'dead',
      player && s.crossing?.material === 'fence',
      player && s.crossing?.material === 'concrete',
    );
    if (e?.state !== 'dead')
      labels.push({
        p: v(actor.x, actor.y, 1.32),
        text: player ? 'ALEX' : (e!.group ?? e!.faction),
        color: player ? '#cdf4dc' : '#e5e4cc',
      });
    if (e && e.state !== 'dead') {
      if (night) {
        const dx = Math.cos(heading),
          dy = Math.sin(heading);
        const hand = v(e.x + 0.12 * dx - 0.22 * dy, e.y + 0.12 * dy + 0.22 * dx, 0.47);
        const lens = v(hand.x + 0.22 * dx, hand.y + 0.22 * dy, 0.47);
        beam(hand, lens, 0.045, '#768d99');
        beam(v(lens.x - 0.02 * dx, lens.y - 0.02 * dy, 0.47), lens, 0.052, '#f4edaa85');
      }
      if (e.state === 'combat')
        beam(
          v(e.x + 0.1 * Math.cos(heading), e.y + 0.1 * Math.sin(heading), 0.67),
          v(e.x + 0.48 * Math.cos(heading), e.y + 0.48 * Math.sin(heading), 0.65),
          0.027,
          '#3d4c4d',
        );
      if ((e.shot ?? 0) > 0 && !reducedMotion) {
        const px = e.x + 0.5 * Math.cos(heading),
          py = e.y + 0.5 * Math.sin(heading);
        face(
          [v(px - 0.09, py, 0.65), v(px, py, 0.79), v(px + 0.09, py, 0.65), v(px, py, 0.56)],
          '#ffe5a0',
        );
      }
    }
  }
  for (const item of s.items) {
    if (item.taken) continue;
    box(
      item.x - 0.16,
      item.y - 0.14,
      0,
      0.32,
      0.28,
      0.25,
      item.type === 'water' ? '#649eae' : '#b3a06f',
      '#d5d7b3',
      '#73877a',
    );
  }
  if (aim) {
    for (let i = 0; i < 120; i += 2) {
      const a = (i * Math.PI) / 60,
        b = ((i + 1) * Math.PI) / 60;
      face(
        [
          v(s.x + Math.cos(a) * DISTRACTION_RANGE, s.y + Math.sin(a) * DISTRACTION_RANGE, 0.04),
          v(s.x + Math.cos(b) * DISTRACTION_RANGE, s.y + Math.sin(b) * DISTRACTION_RANGE, 0.04),
          v(
            s.x + Math.cos(b) * (DISTRACTION_RANGE - 0.025),
            s.y + Math.sin(b) * (DISTRACTION_RANGE - 0.025),
            0.04,
          ),
          v(
            s.x + Math.cos(a) * (DISTRACTION_RANGE - 0.025),
            s.y + Math.sin(a) * (DISTRACTION_RANGE - 0.025),
            0.04,
          ),
        ],
        '#93f5d0',
        true,
      );
    }
  }
  if (!s.companion.helped)
    labels.push({ p: v(s.companion.x, s.companion.y, 1.32), text: 'E · HELP', color: '#ffe5a1' });
  if (s.gate.phase === 'warning')
    labels.push({
      p: v(s.gate.x + 0.5, s.gate.y + 0.5, 0.2),
      text: `GATE ${Math.ceil(s.gate.remaining)}s`,
      color: '#ffe593',
    });
  for (const mark of [s.beacon, aim])
    if (mark) {
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12,
          b = ((i + 1) * Math.PI) / 12;
        face(
          [
            v(mark.x + Math.cos(a) * 0.4, mark.y + Math.sin(a) * 0.4, 0.045),
            v(mark.x + Math.cos(b) * 0.4, mark.y + Math.sin(b) * 0.4, 0.045),
            v(mark.x + Math.cos(b) * 0.34, mark.y + Math.sin(b) * 0.34, 0.045),
            v(mark.x + Math.cos(a) * 0.34, mark.y + Math.sin(a) * 0.34, 0.045),
          ],
          mark === aim ? (canDistract(s, mark.x, mark.y) ? '#93f5d0' : '#ff7790') : '#ffe59b',
          true,
        );
      }
    }
  const paint = (mesh: Mesh) => {
    const points = mesh.p.map(project);
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    const luminous = ['#f4edaa85', '#ffe5a0', '#eadca1', '#93f5d0', '#ff7790', '#ffe59b'].includes(
      mesh.color,
    );
    if (night && !luminous && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(mesh.color)) {
      const rgb = Number.parseInt(mesh.color.slice(1, 7), 16);
      const r = Math.round(((rgb >> 16) & 255) * 0.27),
        g = Math.round(((rgb >> 8) & 255) * 0.34),
        b = Math.round((rgb & 255) * 0.47);
      c.fillStyle = `rgba(${r},${g},${b},${mesh.color.length === 9 ? Number.parseInt(mesh.color.slice(7), 16) / 255 : 1})`;
    } else c.fillStyle = mesh.color;
    c.fill();
  };
  // Ground is its own pass; foreground raised meshes then occlude bodies by physical depth.
  if (night) {
    c.fillStyle = '#071529ce';
    c.fillRect(0, 0, 960, 640);
  }
  floor.forEach(paint);
  meshes.sort((a, b) => b.depth - a.depth).forEach(paint);
  // Placement guides deliberately overlay cover, so the far-side exits remain selectable.
  if (s.tunnelPlacement) {
    c.save();
    for (const side of ['south', 'north'] as const)
      for (const p of tunnelCandidates(s, side)) {
        const selected =
          tunnelCursor && Math.hypot(p.x - tunnelCursor.x, p.y - tunnelCursor.y) < 0.1;
        const color = selected ? '#ffe59b' : side === 'south' ? '#93f5d0' : '#89baff';
        const points = [
          [-0.43, -0.43],
          [0.43, -0.43],
          [0.43, 0.43],
          [-0.43, 0.43],
        ].map(([x, y]) => project(v(p.x + x, p.y + y, 0.06)));
        if (points.every((p) => p.x < 0 || p.x > 960 || p.y < 0 || p.y > 640)) continue;
        c.beginPath();
        points.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
        c.closePath();
        c.fillStyle = selected ? '#fff2a63b' : '#80c9ff14';
        c.fill();
        c.strokeStyle = color;
        c.lineWidth = selected ? 3 : 1.5;
        c.setLineDash(side === 'north' ? [5, 3] : []);
        c.stroke();
      }
    c.restore();
  }
  c.textAlign = 'center';
  c.font = 'bold 11px monospace';
  for (const label of labels) {
    const p = project(label.p);
    if (/^(TUNNEL|SEALING)/.test(label.text)) {
      for (const actor of cast) {
        if (actor.e?.state === 'dead') continue;
        const at = project(v(actor.x, actor.y, 1.32));
        if (Math.abs(p.x - at.x) < 110 && Math.abs(p.y - at.y) < 65) p.x += p.x < 760 ? 140 : -140;
      }
    }
    if (p.x < 30 || p.x > 930 || p.y < 30 || p.y > 610) continue;
    const w = c.measureText(label.text).width;
    c.fillStyle = '#172e36df';
    c.fillRect(p.x - w / 2 - 4, p.y - 12, w + 8, 16);
    c.fillStyle = label.color;
    c.fillText(label.text, p.x, p.y);
  }
  const meters = [
    ...(s.tunnelTransit
      ? []
      : [{ x: s.x, y: s.y, health: s.health, attention: null as number | null }]),
    ...s.enemies
      .filter((e) => e.state !== 'dead')
      .map((e) => ({ x: e.x, y: e.y, health: e.health ?? 100, attention: e.meter })),
  ];
  c.font = 'bold 9px monospace';
  for (const actor of meters) {
    const p = project(v(actor.x, actor.y, 1.32));
    if (p.x < 48 || p.x > 912 || p.y < 30 || p.y > 580) continue;
    const x = Math.round(p.x - 43),
      y = Math.round(p.y - (actor.attention === null ? 30 : 44)),
      health = Math.max(0, Math.min(100, actor.health));
    c.fillStyle = '#07151fee';
    c.fillRect(x - 2, y - 2, 90, actor.attention === null ? 17 : 31);
    c.textAlign = 'left';
    c.fillStyle = '#e7f5e7';
    c.fillText('HP', x + 2, y + 8);
    c.fillStyle = '#314a49';
    c.fillRect(x + 20, y + 1, 44, 7);
    c.fillStyle = health < 30 ? '#fa9d83' : '#7ee2ad';
    c.fillRect(x + 20, y + 1, (44 * health) / 100, 7);
    c.textAlign = 'right';
    c.fillStyle = '#edf8dc';
    c.fillText(String(Math.round(health)), x + 85, y + 8);
    if (actor.attention !== null) {
      const attention = Math.max(0, Math.min(1, actor.attention));
      c.textAlign = 'left';
      c.fillStyle = '#efddb4';
      c.fillText('!', x + 8, y + 21);
      c.fillStyle = '#454338';
      c.fillRect(x + 20, y + 14, 44, 7);
      c.fillStyle = '#f3c466';
      c.fillRect(x + 20, y + 14, 44 * attention, 7);
      c.textAlign = 'right';
      c.fillStyle = '#fff0c4';
      c.fillText(`${Math.round(attention * 100)}%`, x + 85, y + 21);
    }
  }
  c.textAlign = 'center';
  c.font = 'bold 11px monospace';
  if (s.tunnelPlacement) {
    c.fillStyle = '#112939f0';
    c.fillRect(180, 572, 600, 34);
    c.fillStyle = '#ffe59b';
    c.textAlign = 'center';
    c.fillText(
      `CHOOSE ${s.tunnelPlacement.entrance ? 'NORTH EXIT' : 'SOUTH ENTRY'} · ARROWS + ENTER OR CLICK A MARKED TILE`,
      480,
      594,
    );
  }
  if (s.tunnelTransit) {
    const transit = s.tunnelTransit;
    c.fillStyle = '#102b36ed';
    c.fillRect(220, 558, 520, 64);
    c.fillStyle = '#dce7cb';
    c.textAlign = 'center';
    c.fillText(
      transit.remaining > 0
        ? `MOVING UNDERGROUND · ${Math.ceil(transit.remaining)}s`
        : 'WAITING FOR A CLEAR EXIT',
      480,
      580,
    );
    c.fillStyle = '#405c64';
    c.fillRect(240, 598, 480, 8);
    c.fillStyle = '#c6c896';
    c.fillRect(240, 598, 480 * (1 - transit.remaining / transit.duration), 8);
  }
  if (s.construction) {
    const b = s.barriers.find((b) => b.x === s.construction!.x && b.y === s.construction!.y);
    const action =
      b?.material === 'wire'
        ? 'CUTTING WIRE'
        : b?.material === 'fence'
          ? 'BUILDING LADDER'
          : 'DIGGING TUNNEL';
    c.fillStyle = '#1b343aed';
    c.fillRect(260, 564, 440, 52);
    c.fillStyle = '#c5f0cd';
    c.fillText(`${action} · ${Math.round(s.construction.progress * 100)}%`, 480, 584);
    c.fillStyle = '#50685f';
    c.fillRect(280, 595, 400, 7);
    c.fillStyle = '#a8dfac';
    c.fillRect(280, 595, 400 * s.construction.progress, 7);
  }
  const office = project(v(ox, oy));
  if (office.x < 40 || office.x > 920 || office.y < 30 || office.y > 590) {
    c.fillStyle = '#163c34e8';
    c.fillRect(12, 12, 210, 28);
    c.fillStyle = '#c9f1c4';
    c.textAlign = 'left';
    c.fillText(`${office.x < 480 ? '←' : '→'} ASYLUM OFFICE`, 25, 31);
  }
  // Overview keeps the enlarged seeded district navigable while the main camera follows Alex.
  const mx = 778,
    my = 16,
    scale = 2.5;
  c.fillStyle = '#10242dea';
  c.fillRect(mx - 8, my - 8, MAP_WIDTH * scale + 16, MAP_HEIGHT * scale + 32);
  c.fillStyle = '#334f54';
  c.fillRect(mx, my, MAP_WIDTH * scale, MAP_HEIGHT * scale);
  c.fillStyle = '#a49a7d';
  for (const tile of s.walls) {
    const [x, y] = tile.split(',').map(Number);
    c.fillRect(mx + x * scale, my + y * scale, scale, scale);
  }
  for (const b of s.barriers) {
    c.fillStyle = b.open
      ? '#86edb4'
      : b.material === 'wire'
        ? '#b7cfb3'
        : b.material === 'fence'
          ? '#d8b779'
          : '#a6abb8';
    c.fillRect(mx + b.x * scale, my + b.y * scale, scale, scale);
  }
  for (const e of s.enemies) {
    if (e.state === 'dead') continue;
    c.fillStyle = e.faction === 'ICE' || e.faction === 'Border Patrol' ? '#8fbce7' : '#e9a09d';
    c.fillRect(mx + e.x * scale - 1, my + e.y * scale - 1, 3, 3);
  }
  for (const p of [s.office, s]) {
    c.fillStyle = p === s ? '#ffffff' : '#93f5d0';
    c.fillRect(mx + p.x * scale - 2, my + p.y * scale - 2, 4, 4);
  }
  if (s.tunnelPlacement)
    for (const side of ['north', 'south'] as const)
      for (const p of tunnelCandidates(s, side)) {
        c.fillStyle = side === 'south' ? '#93f5d0' : '#89baff';
        c.fillRect(mx + p.x * scale - 1, my + p.y * scale - 1, 3, 3);
      }
  c.textAlign = 'left';
  c.font = '10px monospace';
  c.fillStyle = '#dce5d7';
  c.fillText(`SEED ${s.seed}`, mx, my + MAP_HEIGHT * scale + 15);
  c.restore();
}
