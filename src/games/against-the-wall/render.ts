import type { State } from './model';
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
  // Quiet stepped sky and distant mesa silhouettes remain behind the navigable diorama.
  for (let band = 0; band < 10; band++) {
    ctx.fillStyle = [
      '#13233b',
      '#172b42',
      '#1b3149',
      '#21364d',
      '#293d50',
      '#334451',
      '#414b50',
      '#53574e',
      '#625e4f',
      '#6d6352',
    ][band];
    ctx.fillRect(0, band * 64, 960, 64);
  }
  for (let ridge = 0; ridge < 12; ridge++) {
    const x = ridge * 92 - 30,
      y = 210 + ((ridge * 37) % 95);
    ctx.fillStyle = '#172837';
    ctx.fillRect(x, y, 98, 430);
    ctx.fillRect(x + 15, y - 16, 64, 17);
    ctx.fillStyle = '#203544';
    ctx.fillRect(x + 16, y, 13, 310);
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
    if (['clash', 'recover', 'dead'].includes(e.state)) continue;
    const a = p(e.x, e.y);
    ctx.fillStyle = e.meter > 0.1 ? '#ffae4940' : '#fe559522';
    ctx.strokeStyle = '#ef7c91';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let i = -35; i <= 35; i += 5) {
      const r = (i * Math.PI) / 180 + (e.heading ?? (e.way < 0 ? Math.PI : 0));
      const b = p(e.x + Math.cos(r) * s.config.vision, e.y + Math.sin(r) * s.config.vision);
      ctx.lineTo(b.x, b.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  for (let d = 0; d < 56; d++)
    for (let x = 0; x < 32; x++) {
      const y = d - x;
      if (s.walls.has(`${x},${y}`)) {
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
        ctx.fillStyle = '#dac1a4';
        ctx.fillRect(a.x - 6, a.y - 38, 12, 2);
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
  for (const item of s.items) {
    if (item.taken) continue;
    const a = p(item.x, item.y);
    ctx.fillStyle =
      item.type === 'water' ? '#75d9ef' : item.type === 'token' ? '#ffb9e8' : '#e9c370';
    ctx.fillRect(a.x - 10, a.y - 18, 20, 20);
    ctx.fillStyle = '#17283c';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(item.type === 'water' ? 'W' : item.type === 'token' ? '♪' : '+', a.x, a.y - 2);
  }
  for (const item of s.items) {
    if (item.taken) continue;
    const a = p(item.x, item.y);
    const r = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(a.x + x), Math.round(a.y + y), w, h);
    };
    if (item.type === 'water') {
      r(-7, -17, 14, 21, '#1d455d');
      r(-5, -16, 10, 18, '#65afc0');
      r(-3, -15, 3, 13, '#d8efda');
      r(-4, -21, 8, 4, '#dfdbb6');
      r(-4, -6, 8, 5, '#f0e7c7');
    } else if (item.type === 'token') {
      r(-10, -16, 20, 17, '#403440');
      r(-8, -14, 16, 12, '#d29a67');
      r(-4, -12, 10, 8, '#362b40');
      r(-2, -10, 6, 4, '#81758c');
      r(-7, -20, 10, 4, '#302c3b');
      r(-8, -13, 2, 2, '#ffe0a1');
    } else {
      r(-11, -17, 22, 20, '#53473e');
      r(-9, -15, 18, 15, '#c99d69');
      r(-8, -14, 16, 3, '#ecd096');
      r(-2, -15, 4, 15, '#e8cea0');
      r(-8, -5, 7, 2, '#6a5a48');
    }
  }
  const actors = [
    ...s.enemies.map((e) => ({ ...e, kind: 'enemy' })),
    { x: s.companion.x, y: s.companion.y, kind: 'companion', id: -2 },
    { x: s.x, y: s.y, kind: 'player', id: -1 },
  ].sort((a, b) => a.x + a.y - b.x - b.y);
  for (const a of actors) {
    if (a.kind === 'companion' && s.companion.helped) continue;
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
      continue;
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
      continue;
    }
    ctx.fillStyle = '#080d2266';
    ctx.beginPath();
    ctx.ellipse(q.x, q.y + 5, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle =
      a.kind === 'player'
        ? '#57e5dc'
        : a.kind === 'companion'
          ? '#f1bf58'
          : e?.faction === 'Cartel'
            ? '#a44c65'
            : e?.faction === 'Paramilitary'
              ? '#afb0b8'
              : e?.faction === 'ICE'
                ? '#5085d0'
                : '#91a756';
    ctx.fillRect(q.x - 10, q.y - 25, 20, 24);
    ctx.fillStyle = a.kind === 'player' ? '#ae7354' : '#d69c74';
    ctx.fillRect(q.x - 8, q.y - 41, 16, 16);
    ctx.fillStyle = '#1d243c';
    ctx.fillRect(q.x - 10, q.y - 45, 20, 7);
    ctx.fillRect(q.x - 9, q.y - 2 + stride, 7, 10);
    ctx.fillRect(q.x + 2, q.y - 2 - stride, 7, 10);
    if (a.kind === 'player') {
      ctx.fillStyle = '#e5bb75';
      ctx.fillRect(q.x - 15, q.y - 23, 7, 20);
    }
    const r = (dx: number, dy: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(q.x + dx), Math.round(q.y + dy), w, h);
    };
    // Two-pixel contour and multiple light values give the adults readable depth.
    r(-11, -43, 2, 18, '#161c2c');
    r(9, -40, 2, 15, '#161c2c');
    r(-7, -39, 5, 10, a.kind === 'player' ? '#d99f74' : '#f1c69b');
    r(5, -38, 3, 12, '#9c654f');
    r(-5, -35, 2, 3, '#212535');
    r(3, -35, 2, 3, '#212535');
    r(-1, -29, 4, 1, '#794644');
    r(-9, -46, 15, 3, a.id % 2 ? '#443535' : '#6b4b35');
    r(-11, -42, 5, 7, '#352d32');
    r(-11, -24, 3, 21, '#253146');
    r(8, -24, 3, 21, '#253146');
    r(
      -7,
      -22,
      5,
      17,
      a.kind === 'player' ? '#9befce' : a.kind === 'companion' ? '#ffe0a0' : '#c0c7a3',
    );
    r(4, -21, 4, 17, '#425468');
    r(-3, -24, 5, 4, '#ead7b7');
    r(-1, -20, 2, 17, '#344858');
    r(-9, -5, 18, 3, '#233041');
    r(-1, -5, 4, 3, '#c5ad72');
    r(-13, -21, 3, 15, '#223143');
    r(-12, -18, 3, 10, a.kind === 'player' ? '#5cbeae' : '#8b968b');
    r(-12, -8, 3, 4, '#c89473');
    r(10, -21, 3, 15, '#223143');
    r(10, -18, 3, 10, '#526473');
    r(10, -8, 3, 4, '#c89473');
    r(-8, -1 + stride, 4, 8, '#526077');
    r(3, -1 - stride, 4, 8, '#3e4e63');
    r(-10, 6 + stride, 8, 4, '#141e2e');
    r(2, 6 - stride, 9, 4, '#141e2e');
    r(-9, 6 + stride, 5, 1, '#879193');
    if (a.kind === 'player') {
      r(-17, -22, 7, 19, '#614d43');
      r(-16, -21, 5, 15, '#bda064');
      r(-16, -17, 5, 2, '#e5c184');
      r(-16, -8, 5, 2, '#765f44');
    }
    if (e) {
      r(-11, -43, 22, 4, '#273a42');
      r(
        -8,
        -47,
        17,
        5,
        e.faction === 'ICE'
          ? '#5879a2'
          : e.faction === 'Cartel'
            ? '#713e50'
            : e.faction === 'Paramilitary'
              ? '#75777b'
              : '#788754',
      );
      r(-8, -47, 15, 1, '#b4b39b');
      r(2, -20, 4, 5, '#d9c58c');
    }
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
        const target = e.target === 'player' ? s : s.enemies.find((other) => other.id === e.target);
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
  }
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
  for (const [at, color] of [
    [s.beacon, '#ffe68d'],
    [aim, '#82fff3'],
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
    ctx.fillText('♪', a.x, a.y - 13);
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
