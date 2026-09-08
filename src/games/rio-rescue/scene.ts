import { dock, getCameraViews, cameraSees, type Model } from './model';
import { getTerrain } from './terrain';

type V = { x: number; y: number; z: number };
type Pose = { x: number; y: number; stride: number };
type Face = { points: V[]; color: string; edge?: string; depth: number };
/** Fixed-heading perspective camera: east stays screen-right and south stays screen-down. */
export function drawScene(
  c: CanvasRenderingContext2D,
  m: Model,
  poses: Pose[],
  reducedMotion: boolean,
) {
  const lead = poses[0] ?? m.body[0];
  const cx = lead.x + 0.5,
    cy = lead.y + 0.5;
  const depth = (v: V) => 15 - (v.y - cy) * 0.68 - v.z * 0.73;
  const project = (v: V) => {
    const d = Math.max(2, depth(v));
    return {
      x: 480 + ((v.x - cx) * 1000) / d,
      y: 350 + (((v.y - cy) * 0.73 - v.z * 0.68) * 1000) / d,
    };
  };
  const faces: Face[] = [];
  const v = (x: number, y: number, z = 0): V => ({ x, y, z });
  const face = (points: V[], color: string, edge?: string) => {
    if (points.some((p) => depth(p) < 2)) return;
    faces.push({
      points,
      color,
      edge,
      depth:
        points.reduce((n, p) => n + depth(p), 0) / points.length +
        (points.every((p) => Math.abs(p.z - points[0].z) < 0.0001) && points[0].z <= 0.04
          ? 10000 - points[0].z * 100
          : 0),
    });
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    color: string,
    light: string,
    dark: string,
  ) => {
    face([v(x, y, z + h), v(x + w, y, z + h), v(x + w, y + d, z + h), v(x, y + d, z + h)], light);
    face([v(x, y, z), v(x + w, y, z), v(x + w, y, z + h), v(x, y, z + h)], color);
    face([v(x, y, z), v(x, y + d, z), v(x, y + d, z + h), v(x, y, z + h)], dark);
    face([v(x + w, y, z), v(x + w, y + d, z), v(x + w, y + d, z + h), v(x + w, y, z + h)], dark);
    face([v(x, y + d, z), v(x + w, y + d, z), v(x + w, y + d, z + h), v(x, y + d, z + h)], color);
  };
  const line = (a: V, b: V, color: string, width = 0.025) => {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * width,
      oy = (dx / len) * width;
    face(
      [
        v(a.x + ox, a.y + oy, a.z),
        v(b.x + ox, b.y + oy, b.z),
        v(b.x - ox, b.y - oy, b.z),
        v(a.x - ox, a.y - oy, a.z),
      ],
      color,
    );
  };
  const sky = c.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#849599');
  sky.addColorStop(0.55, '#d8c5a1');
  sky.addColorStop(1, '#978974');
  c.fillStyle = sky;
  c.fillRect(0, 0, 960, 640);
  for (let layer = 0; layer < 3; layer++) {
    c.fillStyle = ['#a9a68f', '#99977f', '#848c79'][layer];
    c.beginPath();
    c.moveTo(0, 640);
    for (let x = -100; x <= 1060; x += 80)
      c.lineTo(
        x,
        90 + layer * 52 + Math.sin(x * 0.013 + layer) * 24 + ((x + 100) % 160 === 0 ? 18 : 0),
      );
    c.lineTo(960, 640);
    c.fill();
  }
  const labels: { point: V; text: string; color: string }[] = [];
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < 24; x++) {
      const terrain = getTerrain(m.district, x, y);
      const center = project(v(x + 0.5, y + 0.5));
      if (center.x < -160 || center.x > 1120 || center.y < -240 || center.y > 1000) continue;
      const seed = (x * 31 + y * 17) % 7;
      if (terrain === 'canyon' || terrain === 'river') {
        const z = terrain === 'canyon' ? -2 : -0.8;
        face(
          [v(x, y, z), v(x + 1, y, z), v(x + 1, y + 1, z), v(x, y + 1, z)],
          terrain === 'canyon' ? '#655244' : '#497f83',
        );
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const other = getTerrain(m.district, x + dx, y + dy);
          if (other === 'canyon' || other === 'river') continue;
          const a =
            dx === -1 ? v(x, y) : dx === 1 ? v(x + 1, y) : dy === -1 ? v(x, y) : v(x, y + 1);
          const b = dx !== 0 ? v(a.x, y + 1) : v(x + 1, a.y);
          for (let j = 0; j < 4; j++)
            face(
              [
                v(a.x, a.y, (z * j) / 4),
                v(b.x, b.y, (z * j) / 4),
                v(b.x, b.y, (z * (j + 1)) / 4),
                v(a.x, a.y, (z * (j + 1)) / 4),
              ],
              ['#bba07b', '#a48a66', '#897359', '#725f4b'][j],
            );
        }
        if (terrain === 'river')
          for (let k = 0; k < 3; k++) {
            const wave = reducedMotion ? 0 : m.time * 0.18;
            const yy = y + ((k * 0.31 + wave) % 1);
            line(
              v(x + 0.12, yy, z + 0.018),
              v(x + 0.78, yy + 0.05, z + 0.018),
              k % 2 ? '#a6cbc0' : '#619e9c',
              0.014,
            );
          }
        continue;
      }
      const palette = ['#b3a47f', '#b5a581', '#b1a27d', '#b6a782', '#b0a17d', '#b4a580', '#b2a37e'];
      face([v(x, y), v(x + 1, y), v(x + 1, y + 1)], palette[seed]);
      face([v(x, y), v(x + 1, y + 1), v(x, y + 1)], palette[(seed + 1) % 7]);
      if (terrain === 'wall') box(x, y, 0, 1, 1, 0.9, '#8c7c62', '#c8b594', '#776b58');
      else if (terrain === 'bridge') {
        box(x, y, -0.16, 1, 1, 0.16, '#695e4c', '#a58d68', '#665c4d');
        for (let k = 0; k < 5; k++)
          box(
            x,
            y + k * 0.2,
            0.01,
            1,
            0.17,
            0.035,
            '#9b805c',
            k % 2 ? '#b9a27c' : '#aa9570',
            '#675b46',
          );
        // Trusses along the banks, leaving the walking surface visibly open.
        for (const side of [0, 1])
          if (getTerrain(m.district, x, y + (side ? 1 : -1)) !== 'bridge') {
            line(v(x, y + side, 0.38), v(x + 1, y + side, 0.38), '#7d7463', 0.025);
            line(v(x, y + side, 0.05), v(x + 1, y + side, 0.38), '#8b806a', 0.025);
            box(
              x + 0.04,
              y + side - 0.035,
              0.02,
              0.05,
              0.07,
              0.43,
              '#837862',
              '#b5a487',
              '#605c51',
            );
          }
      } else if (terrain === 'fence' || terrain === 'climb') {
        const high = terrain === 'climb' ? 0.47 : 0.95;
        box(x + 0.46, y, 0, 0.075, 0.07, high, '#79807b', '#b7bca8', '#596666');
        box(x + 0.46, y + 0.94, 0, 0.075, 0.06, high, '#79807b', '#b7bca8', '#596666');
        for (let k = 1; k <= 4; k++)
          line(v(x + 0.5, y, (high * k) / 4), v(x + 0.5, y + 1, (high * k) / 4), '#9da799', 0.012);
        for (let k = 0; k < 5; k++) {
          line(
            v(x + 0.5, y + k * 0.2, 0),
            v(x + 0.5, y + Math.min(1, k * 0.2 + 0.35), high),
            '#89988c',
            0.009,
          );
          line(
            v(x + 0.5, y + Math.min(1, k * 0.2 + 0.35), 0),
            v(x + 0.5, y + k * 0.2, high),
            '#89988c',
            0.009,
          );
        }
        if (terrain === 'climb') {
          for (let k = 0; k < 3; k++)
            box(x + 0.2, y + 0.36, k * 0.15, 0.5, 0.08, 0.04, '#c6ac75', '#e8d096', '#887952');
          labels.push({ point: v(x + 0.5, y + 0.5, 0.7), text: 'CLIMB', color: '#f8e8a2' });
        }
      } else if (seed === 0) {
        line(v(x + 0.18, y + 0.24, 0.015), v(x + 0.38, y + 0.3, 0.015), '#897a59', 0.018);
        face([v(x + 0.75, y + 0.8), v(x + 0.82, y + 0.8, 0.18), v(x + 0.85, y + 0.85)], '#7b875d');
      }
    }
  const person = (
    x: number,
    y: number,
    stride: number,
    index: number,
    heading: number,
    pickup = false,
  ) => {
    x += 0.5;
    y += 0.5;
    const climb = getTerrain(m.district, Math.floor(x), Math.floor(y)) === 'climb';
    const gait = reducedMotion ? 0 : (stride / 1.4) * 0.095;
    const z = climb ? Math.sin((x - Math.floor(x)) * Math.PI) * 0.75 : 0;
    const skin = ['#d4a27e', '#a47454', '#e2b48c', '#8f634c'][index % 4];
    const coat = pickup
      ? '#d5a65b'
      : index === 0
        ? '#46c9aa'
        : ['#879dc2', '#b78199', '#aaa774'][index % 3];
    // Rotated local body frame retains direction, including visible face on the forward side.
    const local = (a: number, b: number, h: number) =>
      v(
        x + a * Math.cos(heading) - b * Math.sin(heading),
        y + a * Math.sin(heading) + b * Math.cos(heading),
        z + h,
      );
    const cube = (
      a: number,
      b: number,
      h: number,
      w: number,
      d: number,
      t: number,
      col: string,
      lit: string,
    ) => {
      face(
        [
          local(a, b, h + t),
          local(a + w, b, h + t),
          local(a + w, b + d, h + t),
          local(a, b + d, h + t),
        ],
        lit,
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
          col,
        );
    };
    face(
      [
        v(x - 0.23, y - 0.2, 0.012),
        v(x + 0.26, y - 0.2, 0.012),
        v(x + 0.31, y + 0.22, 0.012),
        v(x - 0.2, y + 0.25, 0.012),
      ],
      '#655e4b66',
    );
    for (const side of [-1, 1]) {
      cube(
        side * gait - 0.06,
        side * 0.12 - 0.045,
        0.02,
        0.16,
        0.09,
        0.3,
        side < 0 ? '#384c61' : '#4e6172',
        '#667c86',
      );
      cube(side * gait - 0.03, side * 0.12 - 0.05, 0, 0.21, 0.11, 0.065, '#303d49', '#657078');
      cube(
        -side * gait - 0.06,
        side * 0.24 - 0.045,
        climb ? 0.51 : 0.31,
        0.12,
        0.09,
        0.29,
        coat,
        '#d8d2b4',
      );
      cube(
        -side * gait - 0.04,
        side * 0.24 - 0.04,
        climb ? 0.73 : 0.28,
        0.1,
        0.085,
        0.09,
        skin,
        '#edc4a0',
      );
    }
    cube(-0.13, -0.18, 0.29, 0.26, 0.36, 0.31, coat, '#b8d0b8');
    cube(-0.24, -0.14, 0.33, 0.12, 0.28, 0.26, '#8b7855', '#baa57a');
    cube(-0.1, -0.11, 0.63, 0.22, 0.22, 0.22, skin, '#e7c39b');
    cube(-0.12, -0.12, 0.83, 0.23, 0.24, 0.065, '#493a32', '#75604a');
    face(
      [
        local(0.122, -0.082, 0.78),
        local(0.122, -0.046, 0.78),
        local(0.122, -0.046, 0.75),
        local(0.122, -0.082, 0.75),
      ],
      '#293845',
    );
    face(
      [
        local(0.122, 0.045, 0.78),
        local(0.122, 0.08, 0.78),
        local(0.122, 0.08, 0.75),
        local(0.122, 0.045, 0.75),
      ],
      '#293845',
    );
    face([local(0.122, -0.02, 0.77), local(0.18, 0, 0.71), local(0.122, 0.03, 0.71)], '#ba8765');
  };
  const directions = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  poses.forEach((p, i) => {
    const next = poses[Math.max(0, i - 1)];
    const heading = i ? Math.atan2(next.y - p.y, next.x - p.x) : directions[m.direction];
    person(p.x, p.y, p.stride, i, heading);
  });
  if (m.pickup) {
    person(m.pickup.x, m.pickup.y, 0, 4, Math.PI / 2, true);
    labels.push({
      point: v(m.pickup.x + 0.5, m.pickup.y + 0.5, 1.06),
      text: 'RESCUE',
      color: '#f7e7ab',
    });
  }
  if (m.supply) {
    box(m.supply.x + 0.22, m.supply.y + 0.24, 0, 0.55, 0.5, 0.35, '#a78958', '#ddc28a', '#816f50');
    labels.push({
      point: v(m.supply.x + 0.5, m.supply.y + 0.5, 0.6),
      text: 'SUPPLIES',
      color: '#e7eed0',
    });
  }
  box(dock.x + 0.05, dock.y + 0.08, 0, 0.85, 0.8, 0.65, '#acb9a2', '#e2dcc0', '#7c9a91');
  face(
    [
      v(dock.x - 0.06, dock.y, 0.65),
      v(dock.x + 0.48, dock.y, 0.98),
      v(dock.x + 1.04, dock.y, 0.65),
      v(dock.x + 1.04, dock.y + 1, 0.65),
      v(dock.x + 0.48, dock.y + 1, 0.98),
      v(dock.x - 0.06, dock.y + 1, 0.65),
    ],
    '#5c9d89',
  );
  labels.push({
    point: v(dock.x + 0.5, dock.y + 0.5, 1.12),
    text: m.dockOpen ? 'WELCOME · OPEN' : 'WELCOME CENTER',
    color: '#b3f3cd',
  });
  for (const camera of getCameraViews(m)) {
    box(camera.x + 0.42, camera.y + 0.42, 0, 0.07, 0.07, 0.9, '#5d6f73', '#a1b5af', '#4b5d63');
    box(camera.x + 0.3, camera.y + 0.3, 0.85, 0.32, 0.22, 0.17, '#536d73', '#afbeb0', '#344c57');
    // Detection is grid-based: use the model predicate for each visible tile,
    // including its shared swept angle and fence/wall line-of-sight test.
    for (let y = 1; y < 17; y++)
      for (let x = 1; x < 23; x++) {
        if (!cameraSees(camera, { x, y })) continue;
        const terrain = getTerrain(m.district, x, y);
        if (
          terrain === 'canyon' ||
          terrain === 'river' ||
          terrain === 'wall' ||
          terrain === 'fence'
        )
          continue;
        face(
          [v(x, y, 0.035), v(x + 1, y, 0.035), v(x + 1, y + 1, 0.035)],
          camera.alert > 0 ? '#ec9a5555' : '#eddaa544',
        );
        face(
          [v(x, y, 0.035), v(x + 1, y + 1, 0.035), v(x, y + 1, 0.035)],
          camera.alert > 0 ? '#ec9a5555' : '#eddaa544',
        );
      }
  }
  if (m.hazard)
    for (const cell of m.hazard.cells) {
      box(
        cell.x + 0.06,
        cell.y + 0.06,
        0.025,
        0.88,
        0.88,
        m.hazard.phase === 'active' ? 0.38 : 0.025,
        m.hazard.phase === 'active' ? '#9f5864' : '#c8ae68',
        '#e3c18a',
        '#754f52',
      );
    }
  faces.sort((a, b) => b.depth - a.depth);
  for (const f of faces) {
    const points = f.points.map(project);
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fillStyle = f.color;
    c.fill();
    if (f.edge) {
      c.strokeStyle = f.edge;
      c.lineWidth = 0.6;
      c.stroke();
    }
  }
  c.textAlign = 'center';
  c.font = 'bold 12px monospace';
  for (const label of labels) {
    const p = project(label.point);
    if (p.x < 30 || p.x > 930 || p.y < 30 || p.y > 610) continue;
    const width = c.measureText(label.text).width;
    c.fillStyle = '#182d35dd';
    c.fillRect(p.x - width / 2 - 5, p.y - 13, width + 10, 18);
    c.fillStyle = label.color;
    c.fillText(label.text, p.x, p.y);
  }
  const destination = project(v(dock.x + 0.5, dock.y + 0.5));
  if (destination.x < 40 || destination.x > 920 || destination.y < 30 || destination.y > 600) {
    c.fillStyle = '#17392de8';
    c.fillRect(12, 12, 208, 27);
    c.fillStyle = '#bef2ca';
    c.textAlign = 'left';
    c.fillText(`${destination.x < 480 ? '←' : '→'} WELCOME CENTER`, 24, 31);
  }
  c.textAlign = 'left';
}
