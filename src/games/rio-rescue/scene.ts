import { textureFace, textureWorldFace, type MaterialName } from '../../shared/fidelity/materials';
import { dock, getCameraViews, cameraSees, type Model } from './model';
import { getTerrain, terrainHeight, riverCurrent, MAP_WIDTH, MAP_HEIGHT } from './terrain';

type V = { x: number; y: number; z: number };
type Pose = { x: number; y: number; stride: number };
type Face = { points: V[]; color: string; edge?: string; depth: number; material?: MaterialName };
function shade(color: string, light: number) {
  const value = Number.parseInt(color.slice(1), 16);
  const channel = (shift: number) =>
    Math.max(0, Math.min(255, Math.round(((value >> shift) & 255) * light)));
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`;
}
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
  const heightAt = (x: number, y: number) =>
    terrainHeight(m.district, Math.floor(x), Math.floor(y), m.seed);
  const smoothHeight = (x: number, y: number) => {
    const fx = x - Math.floor(x),
      fy = y - Math.floor(y);
    return (
      heightAt(x, y) * (1 - fx) * (1 - fy) +
      heightAt(x + 1, y) * fx * (1 - fy) +
      heightAt(x, y + 1) * (1 - fx) * fy +
      heightAt(x + 1, y + 1) * fx * fy
    );
  };
  const cameraHeight = smoothHeight(lead.x, lead.y);
  const depth = (v: V) => 15 - (v.y - cy) * 0.68 - (v.z - cameraHeight) * 0.73;
  const project = (v: V) => {
    const d = Math.max(2, depth(v));
    return {
      x: 480 + ((v.x - cx) * 1000) / d,
      y: 350 + (((v.y - cy) * 0.73 - (v.z - cameraHeight) * 0.68) * 1000) / d,
    };
  };
  const faces: Face[] = [];
  const v = (x: number, y: number, z = 0): V => ({ x, y, z });
  const face = (
    points: V[],
    color: string,
    edge?: string,
    ground = false,
    material?: MaterialName,
  ) => {
    if (points.some((p) => depth(p) < 2)) return;
    faces.push({
      points,
      color,
      material,
      edge,
      depth:
        points.reduce((n, p) => n + depth(p), 0) / points.length +
        (ground ? 10000 - points[0].z * 100 : 0),
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
  for (let y = 0; y < MAP_HEIGHT; y++)
    for (let x = 0; x < MAP_WIDTH; x++) {
      const terrain = getTerrain(m.district, x, y, m.seed);
      const center = project(v(x + 0.5, y + 0.5, heightAt(x, y)));
      if (center.x < -160 || center.x > 1120 || center.y < -240 || center.y > 1000) continue;
      const seed = (x * 31 + y * 17 + m.seed) % 7;
      const elevation = terrainHeight(m.district, x, y, m.seed);
      if (terrain === 'canyon' || terrain === 'river') {
        const z = elevation;
        face(
          [v(x, y, z), v(x + 1, y, z), v(x + 1, y + 1, z), v(x, y + 1, z)],
          terrain === 'canyon' ? '#655244' : '#497f83',
          undefined,
          true,
          terrain === 'canyon' ? 'rock' : 'water',
        );
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const other = getTerrain(m.district, x + dx, y + dy, m.seed);
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
              ['#b09a79', '#a18a6b', '#907b5e', '#816d53'][j],
              undefined,
              false,
              'rock',
            );
        }
        if (terrain === 'river')
          for (let k = 0; k < 7; k++) {
            const wave = reducedMotion
              ? 0
              : m.time * (riverCurrent(m.district, x, y, m.seed)?.y ?? 1) * 0.7;
            const yy = y + ((k * 0.137 + wave + x * 0.037) % 1);
            line(
              v(x + 0.08 + (k % 3) * 0.09, yy, z + 0.018),
              v(x + 0.38 + (k % 3) * 0.14, yy + 0.027, z + 0.018),
              k % 3 ? '#aed3c055' : '#d9e4cfa0',
              0.009,
            );
          }
        continue;
      }
      const palette = ['#b3a47f', '#b5a581', '#b1a27d', '#b6a782', '#b0a17d', '#b4a580', '#b2a37e'];
      const earth =
        terrain === 'mesa' ? '#b38a61' : terrain === 'plateau' ? '#acaa81' : palette[seed];
      face(
        [
          v(x, y, elevation),
          v(x + 1, y, elevation),
          v(x + 1, y + 1, elevation),
          v(x, y + 1, elevation),
        ],
        earth,
        undefined,
        true,
        terrain === 'ground' ? 'soil' : 'sandstone',
      );
      if (elevation > 0)
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const low = terrainHeight(m.district, x + dx, y + dy, m.seed);
          if (low >= elevation) continue;
          const a =
            dx === -1 ? v(x, y) : dx === 1 ? v(x + 1, y) : dy === -1 ? v(x, y) : v(x, y + 1);
          const b = dx !== 0 ? v(a.x, y + 1) : v(x + 1, a.y);
          const shade = dx === 1 ? 0.76 : dy === 1 ? 0.9 : 1;
          for (let k = 0; k < 5; k++) {
            const top = elevation - ((elevation - low) * k) / 5,
              bottom = elevation - ((elevation - low) * (k + 1)) / 5;
            face(
              [v(a.x, a.y, top), v(b.x, b.y, top), v(b.x, b.y, bottom), v(a.x, a.y, bottom)],
              `rgb(${Math.round((178 - k * 7) * shade)},${Math.round((157 - k * 8) * shade)},${Math.round((122 - k * 7) * shade)})`,
              undefined,
              false,
              'sandstone',
            );
          }
        }
      if (terrain === 'ground' || terrain === 'mesa' || terrain === 'plateau')
        for (let k = 0; k < 5; k++) {
          const xx = x + ((x * 37 + y * 19 + k * 31 + m.seed) % 97) / 100,
            yy = y + ((x * 13 + y * 41 + k * 23 + m.seed) % 89) / 100;
          face(
            [
              v(xx, yy, elevation + 0.006),
              v(xx + 0.025, yy + 0.007, elevation + 0.006),
              v(xx + 0.012, yy + 0.025, elevation + 0.006),
            ],
            k % 2 ? '#d4c29a45' : '#6e62413b',
            undefined,
            true,
          );
        }
      if (terrain === 'mountain') {
        const peak = v(x + 0.38, y + 0.58, elevation + 1.1 + (seed % 3) * 0.2);
        face([v(x, y, elevation), v(x + 1, y, elevation), peak], '#a29b80');
        face([v(x + 1, y, elevation), v(x + 1, y + 1, elevation), peak], '#7e806d');
        face([v(x + 1, y + 1, elevation), v(x, y + 1, elevation), peak], '#8f876c');
        face([v(x, y + 1, elevation), v(x, y, elevation), peak], '#c4b693');
      }
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
        // Continuous deck grain and dark nail heads make each board a physical surface.
        face(
          [v(x, y, 0.051), v(x + 1, y, 0.051), v(x + 1, y + 1, 0.051), v(x, y + 1, 0.051)],
          '#a38d69',
          undefined,
          false,
          'wood',
        );
        for (const xx of [0.08, 0.92])
          for (let k = 0; k < 5; k++)
            face(
              [
                v(x + xx, y + k * 0.2 + 0.055, 0.055),
                v(x + xx + 0.018, y + k * 0.2 + 0.055, 0.055),
                v(x + xx + 0.018, y + k * 0.2 + 0.075, 0.055),
                v(x + xx, y + k * 0.2 + 0.075, 0.055),
              ],
              '#493e31',
            );
        // Trusses along the banks, leaving the walking surface visibly open.
        for (const side of [0, 1])
          if (getTerrain(m.district, x, y + (side ? 1 : -1), m.seed) !== 'bridge') {
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
        // Sparse dry bunch-grass, grounded on the actual elevated surface.
        for (let blade = 0; blade < 7; blade++) {
          const angle = blade * 2.4,
            length = 0.1 + (blade % 3) * 0.035;
          line(
            v(x + 0.79, y + 0.81, elevation + 0.01),
            v(
              x + 0.79 + Math.cos(angle) * 0.075,
              y + 0.81 + Math.sin(angle) * 0.075,
              elevation + length,
            ),
            blade % 2 ? '#8b8866' : '#686e4c',
            0.007,
          );
        }
      }
    }
  const person = (
    x: number,
    y: number,
    stride: number,
    index: number,
    heading: number,
    pickup = false,
    size = 1,
    style = 0,
  ) => {
    x += 0.5;
    y += 0.5;
    const climb = getTerrain(m.district, Math.floor(x), Math.floor(y), m.seed) === 'climb';
    const gait = reducedMotion ? 0 : (stride / 1.4) * 0.095;
    const baseHeight = smoothHeight(x - 0.5, y - 0.5);
    const swimming = getTerrain(m.district, Math.floor(x), Math.floor(y), m.seed) === 'river';
    const z =
      baseHeight + (climb ? Math.sin((x - Math.floor(x)) * Math.PI) * 0.75 : swimming ? -0.25 : 0);
    const skin = ['#d4a27e', '#a47454', '#e2b48c', '#8f634c'][index % 4];
    const coat = pickup
      ? '#d5a65b'
      : index === 0
        ? '#46c9aa'
        : ['#879dc2', '#b78199', '#aaa774'][index % 3];
    // Rotated local body frame retains direction, including visible face on the forward side.
    const local = (a: number, b: number, h: number) =>
      v(
        x + size * (a * Math.cos(heading) - b * Math.sin(heading)),
        y + size * (a * Math.sin(heading) + b * Math.cos(heading)),
        swimming ? Math.max(baseHeight + 0.012, z + h * size) : z + h * size,
      );
    const oval = (
      a: number,
      b: number,
      h: number,
      rx: number,
      ry: number,
      rz: number,
      color: string,
      rings = 4,
      segments = 10,
    ) => {
      for (let j = 0; j < rings; j++)
        for (let i = 0; i < segments; i++) {
          const point = (ii: number, jj: number) => {
            const angle = (ii * Math.PI * 2) / segments,
              lat = -Math.PI / 2 + (jj * Math.PI) / rings;
            return local(
              a + Math.cos(angle) * Math.cos(lat) * rx,
              b + Math.sin(angle) * Math.cos(lat) * ry,
              h + Math.sin(lat) * rz,
            );
          };
          const angle = ((i + 0.5) * Math.PI * 2) / segments + heading;
          const light =
            0.72 +
            0.21 * Math.cos(angle + 2.1) +
            0.15 * Math.sin(-Math.PI / 2 + ((j + 0.5) * Math.PI) / rings);
          face(
            [point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)],
            shade(color, light),
            undefined,
            false,
            color === coat
              ? 'canvas'
              : color === '#c6aa71' || color === '#cfb274'
                ? 'straw'
                : undefined,
          );
        }
    };
    const limb = (a: number[], b: number[], radius: number, color: string) => {
      // Tapered joint-to-joint cylinders, with rounded articulated joints.
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        dz = b[2] - a[2];
      const len = Math.hypot(dx, dy, dz) || 1;
      const ux = dz / len,
        uz = -dx / len;
      for (let i = 0; i < 8; i++) {
        const point = (p: number[], angle: number, r: number) =>
          local(
            p[0] + Math.cos(angle) * ux * r,
            p[1] + Math.sin(angle) * r,
            p[2] + Math.cos(angle) * uz * r,
          );
        const angle = (i * Math.PI) / 4,
          next = ((i + 1) * Math.PI) / 4;
        face(
          [
            point(a, angle, radius),
            point(a, next, radius),
            point(b, next, radius * 0.8),
            point(b, angle, radius * 0.8),
          ],
          shade(color, 0.78 + 0.2 * Math.cos(angle + heading + 2)),
          undefined,
          false,
          color === coat ? 'canvas' : color === skin ? undefined : 'denim',
        );
      }
      oval(b[0], b[1], b[2], radius * 0.83, radius * 0.83, radius * 0.83, color, 3, 8);
    };
    if (!swimming)
      for (let layer = 5; layer >= 0; layer--) {
        const points = [];
        const radius = 0.17 + layer * 0.035;
        for (let i = 0; i < 20; i++) {
          const angle = (i * Math.PI) / 10;
          points.push(
            v(
              x + Math.cos(angle) * radius * size + 0.06,
              y + Math.sin(angle) * radius * 0.65 * size + 0.07,
              baseHeight + 0.014,
            ),
          );
        }
        face(points, '#25362c0b', undefined, true);
      }
    if (swimming) {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6,
          b = ((i + 1) * Math.PI) / 6;
        line(
          v(x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.24, baseHeight + 0.02),
          v(x + Math.cos(b) * 0.3, y + Math.sin(b) * 0.24, baseHeight + 0.02),
          '#c0e3d3',
          0.012,
        );
      }
    }
    for (const side of [-1, 1]) {
      const swing = side * gait,
        knee = [swing * 0.4, side * 0.095, 0.26],
        ankle = [swing, side * 0.095, 0.065];
      limb([0, side * 0.1, 0.45], knee, 0.066, '#536478');
      limb(knee, ankle, 0.052, '#46576b');
      oval(swing + 0.025, side * 0.095, 0.04, 0.12, 0.058, 0.048, '#413d36', 3, 8);
      const shoulder = [0, side * 0.17, 0.72],
        elbow = [-swing * 0.5, side * 0.215, climb ? 0.82 : 0.53],
        hand = [-swing, side * 0.23, climb ? 0.97 : 0.36];
      limb(shoulder, elbow, 0.052, coat);
      limb(elbow, hand, 0.038, skin);
      oval(hand[0], hand[1], hand[2], 0.043, 0.031, 0.05, skin, 3, 8);
      // A thumb and grouped fingers articulate the hand rather than a mitten sphere.
      limb(
        [hand[0] + 0.025, hand[1], hand[2]],
        [hand[0] + 0.055, hand[1] - side * 0.017, hand[2] - 0.018],
        0.012,
        skin,
      );
      for (let finger = 0; finger < 3; finger++)
        limb(
          [hand[0] - 0.018 + finger * 0.016, hand[1], hand[2] - 0.024],
          [hand[0] - 0.012 + finger * 0.016, hand[1] + side * 0.01, hand[2] - 0.058],
          0.008,
          skin,
        );
    }
    oval(-0.005, 0, 0.58, 0.135, 0.19, 0.22, coat, 5, 12);
    oval(-0.14, 0, 0.56, 0.08, 0.14, 0.16, '#807153', 4, 10);
    oval(0, 0, 0.795, 0.055, 0.063, 0.075, skin, 3, 8);
    oval(0.015, 0, 0.905, 0.104, 0.092, 0.14, skin, 6, 12);
    oval(-0.025, 0, 1.002, 0.1, 0.094, 0.057, '#47362c', 4, 12);
    // Cheekbones, brow, eyelids and lips follow the face heading.
    oval(0.101, -0.061, 0.91, 0.026, 0.027, 0.032, skin, 3, 8);
    oval(0.101, 0.061, 0.91, 0.026, 0.027, 0.032, skin, 3, 8);
    oval(0.119, 0, 0.899, 0.038, 0.025, 0.047, skin, 3, 8);
    for (const side of [-1, 1]) {
      oval(0.104, side * 0.048, 0.945, 0.016, 0.027, 0.012, '#ebe1cc', 3, 8);
      oval(0.117, side * 0.048, 0.945, 0.007, 0.01, 0.009, '#303a38', 3, 6);
      limb([0.102, side * 0.071, 0.965], [0.114, side * 0.028, 0.962], 0.008, '#604b3c');
    }
    limb([0.106, -0.033, 0.851], [0.111, 0.032, 0.851], 0.009, '#875647');
    // Shirt seam and lightly weathered shoulder creases.
    for (const side of [-1, 1])
      limb([0.112, side * 0.13, 0.7], [0.135, side * 0.045, 0.59], 0.008, '#ddd2b4');
    limb([0.136, 0, 0.6], [0.125, 0, 0.44], 0.006, '#697b70');
    if (style === 0 || style === 1) {
      // Wide straw brim, creased crown, shirt bib and work-trouser straps.
      oval(0, 0, 1.025, 0.24, 0.23, 0.023, '#cfb274', 3, 16);
      oval(-0.015, 0, 1.077, 0.113, 0.114, 0.075, '#c6aa71', 4, 12);
      oval(-0.015, 0, 1.037, 0.116, 0.117, 0.013, '#77624a', 3, 12);
      for (const side of [-1, 1])
        face(
          [
            local(0.133, side * 0.1 - 0.025, 0.58),
            local(0.133, side * 0.1 + 0.025, 0.58),
            local(0.133, side * 0.1 + 0.025, 0.32),
            local(0.133, side * 0.1 - 0.025, 0.32),
          ],
          '#c5b992',
        );
    }
    if (style === 2 || style === 3) {
      // Long tied hair and work skirt over boots distinguish the women.
      oval(-0.06, 0, 0.929, 0.08, 0.108, 0.142, '#49362e', 5, 12);
      oval(-0.155, 0, 0.85, 0.052, 0.065, 0.13, '#554031', 4, 10);
      // Closed pleated cloth follows the hips; the hem swings with the stride.
      for (let panel = 0; panel < 16; panel++) {
        const a = (panel * Math.PI) / 8,
          b = ((panel + 1) * Math.PI) / 8;
        const hem = (angle: number) =>
          local(
            Math.cos(angle) * 0.19 + gait * 0.12,
            Math.sin(angle) * 0.225,
            0.13 + 0.012 * Math.cos(angle * 4),
          );
        face(
          [
            local(Math.cos(a) * 0.13, Math.sin(a) * 0.165, 0.44),
            local(Math.cos(b) * 0.13, Math.sin(b) * 0.165, 0.44),
            hem(b),
            hem(a),
          ],
          panel % 2 ? '#8e7380' : '#a08690',
          undefined,
          false,
          'canvas',
        );
      }
    }
    if (style === 3) {
      // Infant is carried in a cloth sling, remaining part of this one entity.
      oval(0.155, 0, 0.54, 0.12, 0.19, 0.14, '#baa18a', 5, 12);
      limb([0.14, -0.13, 0.7], [0.2, 0.1, 0.48], 0.025, '#d0bfa2');
      oval(0.2, 0, 0.72, 0.065, 0.069, 0.078, skin, 4, 10);
      oval(0.19, 0, 0.775, 0.068, 0.073, 0.028, '#e5d4b8', 3, 10);
    }
  };
  const directions = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  poses.forEach((p, i) => {
    const next = poses[Math.max(0, i - 1)];
    const heading = i ? Math.atan2(next.y - p.y, next.x - p.x) : directions[m.direction];
    const style = (Math.imul(m.seed ^ (i + 1), 1597334677) >>> 0) % 6;
    if (style >= 4 && i > 0) {
      const count = style === 4 ? 2 : 3;
      for (let child = 0; child < count; child++)
        person(
          p.x + (child - (count - 1) / 2) * 0.29,
          p.y + (child % 2) * 0.18,
          p.stride,
          i + child,
          heading,
          false,
          0.64,
          child % 2 ? 2 : 5,
        );
    } else person(p.x, p.y, p.stride, i, heading, false, 1, style);
  });
  if (m.pickup) {
    person(m.pickup.x, m.pickup.y, 0, 4, Math.PI / 2, true, 1, (m.seed + m.rescued) % 4);
    labels.push({
      point: v(m.pickup.x + 0.5, m.pickup.y + 0.5, heightAt(m.pickup.x, m.pickup.y) + 1.06),
      text: 'RESCUE',
      color: '#f7e7ab',
    });
  }
  if (m.supply) {
    box(
      m.supply.x + 0.22,
      m.supply.y + 0.24,
      heightAt(m.supply.x, m.supply.y),
      0.55,
      0.5,
      0.35,
      '#a78958',
      '#ddc28a',
      '#816f50',
    );
    labels.push({
      point: v(m.supply.x + 0.5, m.supply.y + 0.5, heightAt(m.supply.x, m.supply.y) + 0.6),
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
    box(
      camera.x + 0.42,
      camera.y + 0.42,
      heightAt(camera.x, camera.y),
      0.07,
      0.07,
      0.9,
      '#5d6f73',
      '#a1b5af',
      '#4b5d63',
    );
    box(
      camera.x + 0.3,
      camera.y + 0.3,
      heightAt(camera.x, camera.y) + 0.85,
      0.32,
      0.22,
      0.17,
      '#536d73',
      '#afbeb0',
      '#344c57',
    );
    // Detection is grid-based: use the model predicate for each visible tile,
    // including its shared swept angle and fence/wall line-of-sight test.
    for (let y = 1; y < MAP_HEIGHT - 1; y++)
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (!cameraSees(camera, { x, y })) continue;
        const terrain = getTerrain(m.district, x, y, m.seed);
        if (
          terrain === 'canyon' ||
          terrain === 'wall' ||
          terrain === 'fence' ||
          terrain === 'mountain'
        )
          continue;
        const lightHeight = heightAt(x, y) + 0.035;
        face(
          [v(x, y, lightHeight), v(x + 1, y, lightHeight), v(x + 1, y + 1, lightHeight)],
          camera.alert > 0 ? '#ec9a5555' : '#eddaa544',
          undefined,
          true,
        );

        face(
          [v(x, y, lightHeight), v(x + 1, y + 1, lightHeight), v(x, y + 1, lightHeight)],
          camera.alert > 0 ? '#ec9a5555' : '#eddaa544',
          undefined,
          true,
        );
      }
  }
  if (m.hazard)
    for (const cell of m.hazard.cells) {
      box(
        cell.x + 0.06,
        cell.y + 0.06,
        heightAt(cell.x, cell.y) + 0.025,
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
    if (f.material) {
      if (['soil', 'sandstone', 'rock', 'water', 'wood'].includes(f.material))
        textureWorldFace(c, points, f.points, f.material, f.material === 'water' ? 0.25 : 0.38);
      else textureFace(c, points, f.material, 0.25);
    }
    // Distance haze is applied to each opaque material face, leaving status/vision overlays clear.
    if (f.material) {
      const distance =
        f.points.reduce((sum, p) => sum + Math.max(0, cy - p.y - 2), 0) / f.points.length;
      const haze = Math.min(0.19, distance * 0.014);
      if (haze > 0) {
        c.beginPath();
        points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
        c.closePath();
        c.fillStyle = `rgba(198,188,158,${haze})`;
        c.fill();
      }
    }
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
  // Full-map overview makes the larger procedural terrain navigable.
  c.save();
  const mapX = 790,
    mapY = 34,
    scale = 3;
  c.fillStyle = '#102b35ed';
  c.fillRect(mapX - 10, mapY - 25, 164, 154);
  const colors: Record<string, string> = {
    ground: '#b2a37e',
    canyon: '#574632',
    river: '#4c9fac',
    bridge: '#dfbf85',
    mesa: '#b67f57',
    plateau: '#8b9368',
    mountain: '#695f50',
    wall: '#5c6e66',
    fence: '#d9c3a1',
    climb: '#f4e5a6',
  };
  for (let y = 0; y < MAP_HEIGHT; y++)
    for (let x = 0; x < MAP_WIDTH; x++) {
      c.fillStyle = colors[getTerrain(m.district, x, y, m.seed)] ?? '#b2a37e';
      c.fillRect(mapX + x * scale, mapY + y * scale, scale, scale);
    }
  const marker = (x: number, y: number, color: string, r = 2) => {
    c.fillStyle = '#0b2029';
    c.fillRect(mapX + x * scale - r - 1, mapY + y * scale - r - 1, r * 2 + 2, r * 2 + 2);
    c.fillStyle = color;
    c.fillRect(mapX + x * scale - r, mapY + y * scale - r, r * 2, r * 2);
  };
  for (const cam of getCameraViews(m)) marker(cam.x + 0.5, cam.y + 0.5, '#ed8e72', 1.5);
  marker(dock.x + 0.5, dock.y + 0.5, '#a9edaf');
  if (m.pickup) marker(m.pickup.x + 0.5, m.pickup.y + 0.5, '#ffdf76');
  for (const p of poses.slice(1)) {
    c.fillStyle = '#d3e7d3';
    c.fillRect(mapX + (p.x + 0.5) * scale - 1, mapY + (p.y + 0.5) * scale - 1, 2, 2);
  }
  marker(lead.x + 0.5, lead.y + 0.5, '#64f5dc', 2);
  c.font = 'bold 10px monospace';
  c.textAlign = 'left';
  c.fillStyle = '#e5e8cd';
  c.fillText(`MAP · SEED ${m.seed}`, mapX, mapY - 10);
  c.font = '9px monospace';
  c.fillStyle = '#64f5dc';
  c.fillText('YOU', mapX, mapY + 121);
  c.fillStyle = '#ffdf76';
  c.fillText('RESCUE', mapX + 29, mapY + 121);
  c.fillStyle = '#a9edaf';
  c.fillText('DOCK', mapX + 80, mapY + 121);
  c.fillStyle = '#ed8e72';
  c.fillText('CAM', mapX + 116, mapY + 121);
  c.restore();
  c.textAlign = 'left';
}
