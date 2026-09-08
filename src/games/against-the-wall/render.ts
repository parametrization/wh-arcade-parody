import { canDistract, type State } from './model';
import { visionBoundary, DISTRACTION_RANGE } from './visibility';
import { figure } from './figures';
export const project = (x: number, y: number) => ({ x: (x - y) * 32, y: (x + y) * 16 });
export function camera(s: State) {
  const p = project(s.x, s.y);
  return { x: 480 - p.x, y: 340 - p.y };
}
export function unproject(s: State, x: number, y: number) {
  const c = camera(s);
  x -= c.x;
  y -= c.y;
  return { x: x / 64 + y / 32, y: y / 32 - x / 64 };
}
export function draw(
  ctx: CanvasRenderingContext2D,
  s: State,
  aim: null | { x: number; y: number },
  variant: string,
  reducedMotion = false,
) {
  ctx.fillStyle = variant === 'B' ? '#30253e' : variant === 'C' ? '#20393d' : '#0b1429';
  ctx.fillRect(0, 0, 960, 640);
  const sky = ctx.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#43596e');
  sky.addColorStop(0.6, '#b6ad92');
  sky.addColorStop(1, '#c1aa7a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 640);
  for (let layer = 0; layer < 3; layer++) {
    for (let ridge = -1; ridge < 7; ridge++) {
      const x = ridge * 180 + layer * 60;
      const y = 180 + layer * 90 + ((ridge * 31 + 80) % 67);
      ctx.fillStyle = ['#83908e', '#667876', '#4d6461'][layer];
      ctx.beginPath();
      ctx.moveTo(x - 80, 640);
      ctx.lineTo(x + 25, y + 40);
      ctx.lineTo(x + 90, y);
      ctx.lineTo(x + 175, y + 65);
      ctx.lineTo(x + 250, 640);
      ctx.fill();
      ctx.fillStyle = '#e7cf9c20';
      ctx.beginPath();
      ctx.moveTo(x + 90, y);
      ctx.lineTo(x + 120, 640);
      ctx.lineTo(x - 80, 640);
      ctx.lineTo(x + 25, y + 40);
      ctx.fill();
    }
  }
  const c = camera(s);
  const p = (x: number, y: number) => {
    const a = project(x, y);
    return { x: a.x + c.x, y: a.y + c.y };
  };
  const diamond = (x: number, y: number, fill: string, h = 0) => {
    const a = p(x, y);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - h);
    ctx.lineTo(a.x + 32, a.y + 16 - h);
    ctx.lineTo(a.x, a.y + 32 - h);
    ctx.lineTo(a.x - 32, a.y + 16 - h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a4c7544';
    ctx.stroke();
    if (h) {
      ctx.fillStyle = '#443153';
      ctx.beginPath();
      ctx.moveTo(a.x - 32, a.y + 16 - h);
      ctx.lineTo(a.x, a.y + 32 - h);
      ctx.lineTo(a.x, a.y + 32);
      ctx.lineTo(a.x - 32, a.y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#513965';
      ctx.beginPath();
      ctx.moveTo(a.x + 32, a.y + 16 - h);
      ctx.lineTo(a.x, a.y + 32 - h);
      ctx.lineTo(a.x, a.y + 32);
      ctx.lineTo(a.x + 32, a.y + 16);
      ctx.closePath();
      ctx.fill();
    }
  };
  for (let d = 0; d < 56; d++)
    for (let x = 0; x < 32; x++) {
      const y = d - x;
      if (y < 0 || y >= 24) continue;
      const a = p(x, y);
      if (a.x < -64 || a.x > 1024 || a.y < -40 || a.y > 720) continue;
      diamond(x, y, ['#716e5a', '#77705a', '#696954'][(x + y * 3) % 3]);
      ctx.fillStyle = (x + y) % 2 ? '#d8c8980d' : '#253b380d';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + 32, a.y + 16);
      ctx.lineTo(a.x, a.y + 32);
      ctx.closePath();
      ctx.fill();
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 ? '#9e9270' : '#555b4d';
        ctx.fillRect(
          Math.round(a.x - 17 + ((x * 7 + y * 11 + k * 9) % 34)),
          Math.round(a.y + 11 + ((x * 3 + y * 7 + k * 5) % 10)),
          3,
          1,
        );
      }
      if ((x * 13 + y * 7) % 37 === 0) {
        ctx.fillStyle = '#344c42';
        ctx.fillRect(a.x + 7, a.y + 9, 2, 9);
        ctx.fillRect(a.x + 3, a.y + 13, 10, 2);
        ctx.fillStyle = '#839b60';
        ctx.fillRect(a.x + 7, a.y + 9, 1, 6);
      }
    }
  for (const e of s.enemies) {
    if (['clash', 'recover', 'dead', 'investigate'].includes(e.state)) continue;
    const a = p(e.x, e.y);
    const rx = s.config.vision * 46,
      ry = s.config.vision * 23;
    if (a.x + rx < 0 || a.x - rx > 960 || a.y + ry < 0 || a.y - ry > 640) continue;
    ctx.fillStyle = e.meter > 0.1 ? '#ffae4940' : '#fe559522';
    ctx.strokeStyle = '#ef7c91';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (const point of visionBoundary(s, e)) {
      const b = p(point.x, point.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (aim) {
    ctx.strokeStyle = '#82fff3';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const angle = (i / 120) * Math.PI * 2;
      const point = p(
        s.x + Math.cos(angle) * DISTRACTION_RANGE,
        s.y + Math.sin(angle) * DISTRACTION_RANGE,
      );
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  }
  const scenery: { x: number; y: number; wall: boolean; paint: () => void }[] = [];
  for (let d = 0; d < 56; d++)
    for (let x = 0; x < 32; x++) {
      const y = d - x;
      if (s.walls.has(`${x},${y}`)) {
        const screen = p(x, y);
        if (screen.x < -32 || screen.x > 992 || screen.y < -32 || screen.y > 682) continue;
        scenery.push({
          x,
          y,
          wall: true,
          paint: () => {
            diamond(x, y, '#af968b', 42);
            const a = p(x, y);
            ctx.strokeStyle = '#302e40';
            ctx.lineWidth = 1;
            for (let h = 10; h <= 34; h += 11) {
              ctx.beginPath();
              ctx.moveTo(a.x - 31, a.y + 16 - h);
              ctx.lineTo(a.x, a.y + 32 - h);
              ctx.lineTo(a.x + 31, a.y + 16 - h);
              ctx.stroke();
            }
            ctx.strokeStyle = '#766478';
            for (let h = 0; h < 3; h++) {
              ctx.beginPath();
              ctx.moveTo(a.x - 16, a.y + 13 - h * 11);
              ctx.lineTo(a.x - 16, a.y + 23 - h * 11);
              ctx.moveTo(a.x + 16, a.y + 12 - h * 11);
              ctx.lineTo(a.x + 16, a.y + 22 - h * 11);
              ctx.stroke();
            }
            ctx.fillStyle = '#efdbc326';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - 42);
            ctx.lineTo(a.x + 32, a.y - 26);
            ctx.lineTo(a.x, a.y - 10);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#e8ceb0';
            ctx.beginPath();
            ctx.moveTo(a.x - 31, a.y - 26);
            ctx.lineTo(a.x, a.y - 11);
            ctx.lineTo(a.x + 31, a.y - 26);
            ctx.stroke();
            ctx.fillStyle = '#dac1a4';
            ctx.fillRect(a.x - 6, a.y - 38, 12, 2);
          },
        });
      }
    }
  if (s.gate.phase === 'warning') {
    diamond(s.gate.x, s.gate.y, '#ffe593');
    const a = p(s.gate.x, s.gate.y);
    ctx.fillStyle = '#2b2542';
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`GATE ${Math.ceil(s.gate.remaining)}`, a.x, a.y + 20);
  }
  scenery.push({
    x: s.office.x,
    y: s.office.y,
    wall: false,
    paint: () => {
      const office = p(s.office.x, s.office.y);
      ctx.fillStyle = '#12392e';
      ctx.fillRect(office.x - 85, office.y - 92, 170, 104);
      ctx.strokeStyle = '#69f2b2';
      ctx.lineWidth = 3;
      ctx.strokeRect(office.x - 85, office.y - 92, 170, 104);
      ctx.fillStyle = '#69f2b2';
      ctx.fillRect(office.x - 30, office.y - 55, 60, 66);
      ctx.fillStyle = '#23362f';
      ctx.fillRect(office.x - 94, office.y - 102, 188, 14);
      ctx.fillStyle = '#8daf88';
      ctx.fillRect(office.x - 92, office.y - 102, 184, 4);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i % 2 ? '#d8d6ac' : '#427c67';
        ctx.fillRect(office.x - 81 + i * 18, office.y - 66, 18, 10);
      }
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#0b292c';
        ctx.fillRect(office.x + side * 58 - 13, office.y - 45, 26, 32);
        ctx.fillStyle = '#a4d2b4';
        ctx.fillRect(office.x + side * 58 - 10, office.y - 42, 20, 25);
        ctx.fillStyle = '#355e55';
        ctx.fillRect(office.x + side * 58 - 1, office.y - 42, 2, 26);
        ctx.fillRect(office.x + side * 58 - 10, office.y - 30, 20, 2);
      }
      ctx.fillStyle = '#b6c49e';
      ctx.fillRect(office.x - 35, office.y + 9, 70, 7);
      ctx.fillStyle = '#668c75';
      ctx.fillRect(office.x - 40, office.y + 16, 80, 5);
      ctx.fillStyle = '#d3e2b2';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ASYLUM OFFICE', office.x, office.y - 69);
      ctx.fillStyle = '#e6fff1';
      ctx.font = '12px monospace';
      ctx.fillText('INTAKE →', office.x, office.y - 23);
    },
  });
  for (const item of s.items) {
    if (item.taken) continue;
    scenery.push({
      x: item.x,
      y: item.y,
      wall: false,
      paint: () => {
        const a = p(item.x, item.y);
        const face = (points: number[], color: string) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(a.x + points[0], a.y + points[1]);
          for (let i = 2; i < points.length; i += 2)
            ctx.lineTo(a.x + points[i], a.y + points[i + 1]);
          ctx.closePath();
          ctx.fill();
        };
        ctx.fillStyle = '#20312c44';
        ctx.beginPath();
        ctx.ellipse(a.x + 3, a.y + 5, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        const water = item.type === 'water';
        const token = item.type === 'token';
        const color = water ? '#7ac7d2' : token ? '#b7946a' : '#c3a477';
        face([-10, -16, 5, -18, 5, 3, -10, 1], color);
        face([5, -18, 12, -14, 12, 0, 5, 3], water ? '#3f849c' : '#78664d');
        face([-10, -16, -3, -21, 12, -19, 5, -18], water ? '#b5e3df' : '#e3c393');
        face([-9, -15, -6, -15, -6, 0, -9, 0], '#fff4ce40');
        if (water) {
          face([-4, -21, 3, -22, 5, -19, -3, -18], '#e2e1bb');
          face([-7, -7, 3, -8, 3, -2, -7, -1], '#e4ead9');
        } else if (token) {
          face([-6, -13, 2, -14, 2, -6, -6, -5], '#324452');
          face([-4, -12, 1, -12, 1, -8, -4, -7], '#88a8ad');
        } else {
          face([-3, -17, 0, -17, 0, 2, -3, 2], '#f5dab0');
          face([-9, -7, 5, -8, 5, -5, -9, -4], '#846d52');
        }
      },
    });
  }
  const actors = [
    ...s.enemies.map((e) => ({ ...e, kind: 'enemy' })),
    { x: s.companion.x, y: s.companion.y, kind: 'companion', id: -2 },
    { x: s.x, y: s.y, kind: 'player', id: -1 },
  ].sort((a, b) => a.x + a.y - b.x - b.y);
  for (const a of actors) {
    if (a.kind === 'companion' && s.companion.helped) continue;
    scenery.push({
      x: a.x,
      y: a.y,
      wall: false,
      paint: () => {
        const q = p(a.x, a.y);
        const e = a.kind === 'enemy' ? s.enemies.find((e) => e.id === a.id) : null;
        if (e?.state === 'dead') {
          ctx.fillStyle = '#17212b88';
          ctx.fillRect(q.x - 26, q.y - 4, 52, 13);
          ctx.fillStyle =
            e.faction === 'ICE'
              ? '#486a93'
              : e.faction === 'Cartel'
                ? '#914f64'
                : e.faction === 'Paramilitary'
                  ? '#929398'
                  : '#7d8957';
          ctx.fillRect(q.x - 12, q.y - 5, 25, 10);
          ctx.fillStyle = '#d8a982';
          ctx.fillRect(q.x - 23, q.y - 6, 11, 10);
          ctx.fillStyle = '#403238';
          ctx.fillRect(q.x - 25, q.y - 6, 4, 10);
          ctx.fillStyle = '#26364b';
          ctx.fillRect(q.x + 12, q.y - 5, 13, 4);
          ctx.fillRect(q.x + 12, q.y + 2, 14, 4);
          ctx.fillStyle = '#d5cfb5';
          ctx.textAlign = 'center';
          ctx.font = '10px monospace';
          ctx.fillText(`${e.faction} · DOWN`, q.x, q.y - 14);
          return;
        }
        const walking = a.kind === 'player' ? s.moving : e?.moving;
        const stride =
          walking && !reducedMotion
            ? Math.round(
                Math.sin((a.kind === 'player' ? s.walkDistance : (e?.walkDistance ?? 0)) * 11) * 3,
              )
            : 0;
        if (walking && !reducedMotion) q.y -= Math.abs(stride) * 0.4;
        if (e?.state === 'clash') {
          ctx.fillStyle = '#e5d7a9';
          for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.arc(q.x - 20 + j * 10, q.y - 14 + (j % 2) * 8, 15, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#442a4d';
          ctx.font = 'bold 16px monospace';
          ctx.fillText('?! ★', q.x, q.y - 7);
          return;
        }
        const coat =
          a.kind === 'player'
            ? '#49bdb1'
            : a.kind === 'companion'
              ? '#dcac51'
              : e?.faction === 'Cartel'
                ? '#a45f74'
                : e?.faction === 'Paramilitary'
                  ? '#979fa6'
                  : e?.faction === 'ICE'
                    ? '#507ab2'
                    : '#85945d';
        figure(
          ctx,
          q.x,
          q.y,
          coat,
          a.kind === 'player' ? '#c58f6c' : '#dba980',
          stride,
          a.kind === 'player',
          !!e,
          a.kind === 'player' ? s.heading : e?.heading,
        );
        ctx.fillStyle = '#f6ecc9';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(
          a.kind === 'player' ? 'ALEX' : a.kind === 'companion' ? 'E · HELP' : e!.faction,
          q.x,
          q.y - 52,
        );
        if (e) {
          ctx.fillStyle = '#17233d';
          ctx.fillRect(q.x - 18, q.y - 63, 36, 4);
          ctx.fillStyle = '#ffbc59';
          ctx.fillRect(q.x - 18, q.y - 63, 36 * e.meter, 4);
          ctx.fillStyle = '#1a2534';
          ctx.fillRect(q.x - 18, q.y - 69, 36, 3);
          ctx.fillStyle = '#a6cc8c';
          ctx.fillRect(q.x - 18, q.y - 69, (36 * (e.health ?? 100)) / 100, 3);
          if (e.state === 'combat') {
            const target =
              e.target === 'player' ? s : s.enemies.find((other) => other.id === e.target);
            if (target) {
              const to = p(target.x, target.y),
                angle = Math.atan2(to.y - q.y, to.x - q.x);
              const mx = q.x + Math.cos(angle) * 21,
                my = q.y - 20 + Math.sin(angle) * 13;
              ctx.strokeStyle = '#242d3d';
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.moveTo(q.x, q.y - 20);
              ctx.lineTo(mx, my);
              ctx.stroke();
              if ((e.shot ?? 0) > 0 && !reducedMotion) {
                ctx.fillStyle = '#ffe5a0';
                ctx.fillRect(mx - 3, my - 1, 7, 2);
                ctx.fillRect(mx - 1, my - 3, 2, 7);
                ctx.strokeStyle = '#e4c77c';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(to.x, to.y - 18);
                ctx.stroke();
              }
              ctx.lineWidth = 1;
            }
          }
        }
      },
    });
  }
  scenery.push({
    x: 6,
    y: 17,
    wall: false,
    paint: () => {
      const board = p(6, 17);
      ctx.fillStyle = '#c9a150';
      ctx.fillRect(board.x - 110, board.y - 132, 182, 59);
      ctx.fillStyle = '#ead490';
      ctx.fillRect(board.x - 108, board.y - 130, 178, 3);
      const bx = board.x - 105,
        by = board.y - 125,
        trump = s.district === 1;
      ctx.fillStyle = '#273c60';
      ctx.fillRect(bx, by + 24, 29, 23);
      ctx.fillStyle = trump ? '#e8a16b' : '#d4ab88';
      ctx.fillRect(bx + 5, by + 5, 20, 20);
      ctx.fillStyle = trump ? '#f5d87b' : '#553e35';
      ctx.fillRect(bx + 3, by + 1, 24, 7);
      ctx.fillRect(bx + 3, by + 6, 5, 6);
      if (!trump) {
        ctx.fillStyle = '#644737';
        ctx.fillRect(bx + 5, by + 19, 20, 8);
      }
      ctx.fillStyle = '#182840';
      ctx.fillRect(bx + 10, by + 12, 3, 2);
      ctx.fillRect(bx + 20, by + 12, 3, 2);
      ctx.fillStyle = '#e2d4b0';
      ctx.fillRect(bx + 11, by + 25, 9, 7);
      ctx.fillStyle = '#b43c4c';
      ctx.fillRect(bx + 14, by + 27, 4, 18);
      ctx.fillStyle = '#342747';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(s.district === 1 ? 'DONALD TRUMP' : 'JD VANCE', board.x, board.y - 110);
      ctx.font = '11px monospace';
      ctx.fillText(
        s.district === 1 ? 'PHOTO OP THIS WAY' : 'PLEASE WAIT LONGER',
        board.x,
        board.y - 90,
      );
      ctx.fillRect(board.x - 55, board.y - 75, 6, 60);
      ctx.fillRect(board.x + 49, board.y - 75, 6, 60);
    },
  });
  ctx.textAlign = 'center';
  const walls = scenery.filter((object) => object.wall);
  for (const wall of walls) wall.paint();
  // Keep solid scenery in its tile order. Clip sprites against the silhouettes
  // of walls in front of their ground position, including near a wall's side.
  // A center-depth sort alone gets those side edges wrong.
  for (const object of scenery
    .filter((object) => !object.wall)
    .sort((a, b) => a.x + a.y - b.x - b.y)) {
    ctx.save();
    const at = p(object.x, object.y);
    for (const wall of walls) {
      if (object.x >= wall.x + 1 || object.y >= wall.y + 1) continue;
      const w = p(wall.x, wall.y);
      if (Math.abs(w.x - at.x) > 160 || w.y + 32 < at.y - 180 || w.y - 42 > at.y + 40) continue;
      ctx.beginPath();
      ctx.rect(0, 0, 960, 640);
      ctx.moveTo(w.x, w.y - 42);
      ctx.lineTo(w.x + 32, w.y - 26);
      ctx.lineTo(w.x + 32, w.y + 16);
      ctx.lineTo(w.x, w.y + 32);
      ctx.lineTo(w.x - 32, w.y + 16);
      ctx.lineTo(w.x - 32, w.y - 26);
      ctx.closePath();
      ctx.clip('evenodd');
    }
    object.paint();
    ctx.restore();
  }
  for (const [at, color] of [
    [s.beacon, '#ffe68d'],
    [aim, aim && canDistract(s, aim.x, aim.y) ? '#82fff3' : '#ff7790'],
  ] as const) {
    if (!at) continue;
    const a = p(at.x, at.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(a.x, a.y, 28, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '22px monospace';
    ctx.fillText(at === aim && !canDistract(s, at.x, at.y) ? '×' : '♪', a.x, a.y - 13);
  }
  const marker = p(s.office.x, s.office.y);
  if (marker.x < 70 || marker.x > 890 || marker.y < 50 || marker.y > 560) {
    const mx = Math.max(90, Math.min(870, marker.x)),
      my = Math.max(50, Math.min(570, marker.y));
    ctx.fillStyle = '#83f1c7';
    ctx.fillRect(mx - 76, my - 18, 152, 30);
    ctx.fillStyle = '#123a36';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INTAKE OFFICE →', mx, my + 2);
  }
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;
}
