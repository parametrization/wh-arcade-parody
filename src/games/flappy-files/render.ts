import type { Model } from './model';
import { value } from './config';
export function render(ctx: CanvasRenderingContext2D, m: Model) {
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
  for (let i = 0; i < 7; i++) {
    const x = ((((i * 104 - offset) % 650) + 650) % 650) - 90;
    rect(x, 42 + (i % 3) * 31, 70, 10, '#e5f7f8');
    rect(x + 16, 34 + (i % 3) * 31, 35, 10, '#e5f7f8');
  }
  rect(0, 310, 512, 78, '#598e9c');
  for (let i = 0; i < 6; i++) {
    const x = i * 108 - ((offset * 0.4) % 108);
    rect(x, 270, 80, 118, '#bad5d7');
    rect(x + 8, 258, 64, 12, '#d5e4de');
    for (let j = 0; j < 4; j++) rect(x + 10 + j * 17, 286, 9, 80, '#759aa7');
  }
  rect(194, 238, 124, 10, '#d5e4de');
  rect(208, 225, 96, 13, '#d5e4de');
  rect(226, 207, 60, 18, '#d5e4de');
  rect(252, 190, 8, 17, '#f7edc8');
  for (const col of m.columns) {
    const w = value(m.config, 'columns.width'),
      bottom = col.gapY + col.gap;
    for (const [y, h] of [
      [0, col.gapY],
      [bottom, 388 - bottom],
    ]) {
      rect(col.x, y, w, h, '#554c59');
      rect(col.x + 4, y, w - 8, h, '#d2c5a5');
      for (let j = 8; j < w - 4; j += 10) rect(col.x + j, y, 3, h, '#a4977c');
    }
    rect(col.x - 4, col.gapY - 12, w + 8, 12, '#eee1be');
    rect(col.x - 4, bottom, w + 8, 12, '#eee1be');
    elephant(col.x + w / 2, bottom + 15, false);
    elephant(col.x + w / 2, col.gapY - 16, true);
    if (col.burger && !col.collected) hamburger(col.x + w / 2, col.gapY + col.gap / 2);
    if (m.config['presentation.showColliders']) {
      ctx.strokeStyle = '#ff00ff';
      ctx.strokeRect(col.x, 0, w, col.gapY);
      ctx.strokeRect(col.x, bottom, w, 388 - bottom);
    }
  }
  rect(0, 388, 512, 12, '#eee1be');
  rect(0, 400, 512, 48, '#468c50');
  for (let i = 0; i < 22; i++)
    rect(i * 26 - ((m.time * speedGround()) % 26), 402, 13, 46, '#3d7b47');
  const wing = reduced ? 0 : Math.floor(m.time * 12) % 3;
  const y = m.y;
  rect(132, y + 10, 34, 22, '#432e2b');
  rect(136, y + 6, 24, 20, '#74533a');
  rect(132 - 8, y + 8 + wing * 4, 22, 8, '#5b4030');
  rect(156, y + 4, 18, 16, '#fff8dc');
  rect(168, y + 12, 14, 6, '#f3b945');
  rect(164, y + 8, 4, 4, '#131c2c');
  rect(142, y + 30, 6, 8, '#f6be45');
  rect(156, y + 30, 6, 8, '#f6be45');
  rect(140, y + 36, 32, 18, '#ecd7a5');
  rect(142, y + 34, 12, 4, '#d3af72');
  rect(144, y + 42, 24, 3, '#a92e3e');
  ctx.fillStyle = '#312438';
  ctx.font = 'bold 5px monospace';
  ctx.fillText('EPSTEIN', 142, y + 41);
  ctx.fillText('FILES', 145, y + 50);
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
  function speedGround() {
    return m.phase === 'title' ? 0 : 70;
  }
  function hamburger(x: number, y: number) {
    rect(x - 12, y - 7, 24, 6, '#d99136');
    rect(x - 16, y - 1, 32, 5, '#f4bd59');
    rect(x - 14, y + 4, 28, 5, '#553326');
    rect(x - 15, y + 9, 30, 5, '#dca353');
    rect(x - 9, y - 5, 3, 2, '#fff0a4');
    rect(x + 5, y - 5, 3, 2, '#fff0a4');
  }
  function elephant(x: number, y: number, up: boolean) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (up) ctx.scale(1, -1);
    rect(-15, 5, 30, 24, '#b83245');
    rect(-12, -9, 24, 21, '#9ba4ad');
    rect(-21, -7, 12, 17, '#bac0c3');
    rect(9, -7, 12, 17, '#bac0c3');
    rect(3, 3, 7, 20, '#aeb8c0');
    rect(3, 19, 14, 5, '#aeb8c0');
    rect(-5, -3, 3, 3, '#17273b');
    rect(5, -3, 3, 3, '#17273b');
    rect(-3, 13, 6, 13, '#fae0ac');
    ctx.restore();
  }
  function trump(x: number, y: number, exit: boolean) {
    rect(x + 16, y + 77, 134, 127, '#132c59');
    rect(x + 35, y + 146, 100, 54, '#284873');
    rect(x + 26, y + 194, 120, 12, '#1e3c69');
    rect(x + 42, y + 56, 82, 47, '#df854c');
    rect(x + 30, y + 14, 100, 71, '#ef9356');
    rect(x + 24, y + 10, 110, 20, '#f9d556');
    rect(x + 43, y, 91, 17, '#f9d556');
    rect(x + 117, y + 16, 23, 21, '#f5c748');
    rect(x + 52, y + 38, 13, 5, '#7e4d3c');
    rect(x + 97, y + 38, 13, 5, '#7e4d3c');
    rect(x + 73, y + 66, 31, exit ? 16 : 6, '#7c3038');
    rect(x + 62, y + 99, 39, 21, '#f8eadb');
    rect(x + 79, y + 111, 14, 100, '#c8293b');
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
