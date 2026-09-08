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
) {
  ctx.fillStyle = variant === 'B' ? '#30253e' : variant === 'C' ? '#20393d' : '#0b1429';
  ctx.fillRect(0, 0, 960, 640);
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
      diamond(x, y, (x + y) % 2 ? '#272e45' : '#2d354b');
    }
  for (const e of s.enemies) {
    if (['clash', 'recover'].includes(e.state)) continue;
    const a = p(e.x, e.y);
    ctx.fillStyle = e.meter > 0.1 ? '#ffae4940' : '#fe559522';
    ctx.strokeStyle = '#ef7c91';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let i = -35; i <= 35; i += 5) {
      const r = ((i + (e.way < 0 ? 180 : 0)) * Math.PI) / 180;
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
      if (s.walls.has(`${x},${y}`)) diamond(x, y, '#ae4e97', 42);
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
  ctx.fillStyle = '#0b2c2a';
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
  const actors = [
    ...s.enemies.map((e) => ({ ...e, kind: 'enemy' })),
    { x: s.companion.x, y: s.companion.y, kind: 'companion', id: -2 },
    { x: s.x, y: s.y, kind: 'player', id: -1 },
  ].sort((a, b) => a.x + a.y - b.x - b.y);
  for (const a of actors) {
    if (a.kind === 'companion' && s.companion.helped) continue;
    const q = p(a.x, a.y);
    const e = a.kind === 'enemy' ? s.enemies.find((e) => e.id === a.id) : null;
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
    ctx.fillRect(q.x - 9, q.y - 2, 7, 10);
    ctx.fillRect(q.x + 2, q.y - 2, 7, 10);
    if (a.kind === 'player') {
      ctx.fillStyle = '#e5bb75';
      ctx.fillRect(q.x - 15, q.y - 23, 7, 20);
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
    }
  }
  const board = p(6, 17);
  ctx.fillStyle = '#c9a150';
  ctx.fillRect(board.x - 70, board.y - 130, 140, 55);
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
