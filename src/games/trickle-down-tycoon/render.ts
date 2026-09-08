import type { TycoonConfig } from './config';
import { catchWidth, laneX, resourceNames, type TycoonModel } from './model';
export function portrait(c: CanvasRenderingContext2D, person: number, x: number, y: number) {
  c.fillStyle = '#162139';
  c.fillRect(x, y, 100, 76);
  c.fillStyle = ['#ed995c', '#e2b493', '#efd0ae'][person];
  c.fillRect(x + 35, y + 9, 29, 29);
  c.fillStyle = ['#f4d254', '#503c35', '#55412f'][person];
  c.fillRect(x + 31, y + 5, 34, 9);
  c.fillRect(x + 32, y + 12, 6, 8);
  if (person === 1) {
    c.fillStyle = '#51382d';
    c.fillRect(x + 35, y + 29, 29, 10);
  }
  if (person === 2) {
    c.strokeStyle = '#1b273c';
    c.lineWidth = 2;
    c.strokeRect(x + 38, y + 18, 10, 7);
    c.strokeRect(x + 52, y + 18, 10, 7);
  }
  c.fillStyle = '#131b2c';
  c.fillRect(x + 41, y + 19, 3, 3);
  c.fillRect(x + 55, y + 19, 3, 3);
  c.fillStyle = '#2b5683';
  c.fillRect(x + 24, y + 39, 54, 27);
  c.fillStyle = '#e65361';
  c.fillRect(x + 46, y + 39, 8, 25);
  c.fillStyle = '#d9e6f2';
  c.fillRect(x + 40, y + 39, 6, 9);
  c.fillRect(x + 54, y + 39, 6, 9);
  c.fillStyle = '#10192a';
  c.fillRect(x, y + 63, 100, 13);
  c.fillStyle = '#ffe6a2';
  c.font = 'bold 10px monospace';
  c.textAlign = 'center';
  c.fillText(['DONALD TRUMP', 'JD VANCE', 'MIKE JOHNSON'][person], x + 50, y + 73);
  c.textAlign = 'left';
}
export function render(c: CanvasRenderingContext2D, m: TycoonModel, config: TycoonConfig) {
  c.fillStyle = '#122038';
  c.fillRect(0, 0, 640, 410);
  c.fillStyle = '#192f45';
  c.fillRect(0, 90, 640, 250);
  for (let i = 0; i < 3; i++) portrait(c, i, 20 + i * 113, 5);
  c.fillStyle = '#e3d5a5';
  c.font = 'bold 13px monospace';
  c.fillText('TRICKLE-DOWN TYCOON', 370, 24);
  c.font = '11px monospace';
  c.fillStyle = '#b6d6cc';
  c.fillText(`ROUND ${m.round}/5 · SCORE ${m.score}`, 370, 44);
  c.fillText(`NET ${'♥'.repeat(m.integrity)} · AUDIT ${m.audits}`, 370, 64);
  c.fillStyle = '#9e8753';
  c.fillRect(25, 84, 590, 9);
  for (let i = 0; i < 3; i++) {
    c.fillStyle = '#bba168';
    c.fillRect(laneX[i] - 27, 82, 54, 16);
    c.strokeStyle = '#526578';
    c.setLineDash([4, 9]);
    c.beginPath();
    c.moveTo(laneX[i], 104);
    c.lineTo(laneX[i], 288);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#8393ad';
    c.font = '10px monospace';
    c.fillText(`LANE ${i + 1}`, laneX[i] - 18, 118);
  }
  if (m.event) {
    const names = ['TRUMP: NAMING RIGHTS', 'VANCE: PUBLICITY STORM', 'JOHNSON: BUDGET SCISSORS'];
    c.fillStyle = '#5f454a';
    c.fillRect(141, 131, 359, 23);
    c.fillStyle = '#ffe2a2';
    c.font = '11px monospace';
    c.fillText(`${m.event.time < 2 ? 'INCOMING · ' : ''}${names[m.event.person]}`, 151, 147);
    if (m.event.time >= 2 && m.event.person === 0) {
      c.strokeStyle = '#f3d47e';
      c.lineWidth = 4;
      c.strokeRect(25, 158, 83, 119);
      c.lineWidth = 1;
      c.fillStyle = '#f4d786';
      c.font = 'bold 12px monospace';
      c.fillText('TRUMP', 46, 194);
      c.fillText('TOWER', 46, 214);
    }
    if (m.event.person === 1 && m.event.time >= 2) {
      c.fillStyle = '#dd95bd';
      for (let i = 0; i < 16; i++) c.fillRect(20 + i * 38, 163 + (i % 4) * 23, 4, 4);
    }
    if (m.event.person === 2 && m.event.time >= 2) {
      c.fillStyle = '#ffab9e';
      c.font = '25px monospace';
      c.fillText('✂', m.netX + catchWidth(m) + 8, 316);
    }
  }
  for (const target of m.targets) {
    const x = laneX[target.lane],
      y = target.warning > 0 ? 73 : target.y;
    c.fillStyle = ['#eaa3ad', '#a2ded6', '#e8d79b', '#edcf74', '#8d754b'][target.type];
    if (target.type === 4) {
      c.strokeStyle = '#edcf74';
      c.lineWidth = 3;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.arc(x, y, 18, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.lineWidth = 1;
      c.font = 'bold 10px monospace';
      c.textAlign = 'center';
      c.fillText('EMPTY', x, y + 4);
      c.textAlign = 'left';
    } else {
      c.fillRect(x - 15, y - 15, 30, 30);
      c.fillStyle = '#263650';
      c.font = 'bold 19px monospace';
      c.textAlign = 'center';
      c.fillText(['▤', '+', '⚿', '$'][target.type], x, y + 7);
      c.textAlign = 'left';
    }
    if (target.warning > 0) {
      c.fillStyle = '#fff2bb';
      c.font = '9px monospace';
      c.textAlign = 'center';
      c.fillText('↓ ' + resourceNames[target.type].toUpperCase(), x, 52);
      c.textAlign = 'left';
    }
  }
  const width = catchWidth(m);
  c.fillStyle = m.catchTime > 0 ? '#a3ffe2' : m.cooldown > 0 ? '#637b8b' : '#66c6c2';
  c.beginPath();
  c.moveTo(m.netX - width, 304);
  c.lineTo(m.netX + width, 304);
  c.lineTo(m.netX + width - 12, 330);
  c.lineTo(m.netX - width + 12, 330);
  c.closePath();
  c.fill();
  c.strokeStyle = config.variant === 'basket' ? '#b08450' : '#254756';
  c.lineWidth = 3;
  for (let x = m.netX - width + 14; x < m.netX + width - 4; x += 13) {
    c.beginPath();
    c.moveTo(x, 307);
    c.lineTo(x + 4, 327);
    c.stroke();
  }
  c.lineWidth = 1;
  c.fillStyle = '#f0d4ad';
  c.fillRect(m.netX - width - 10, 289, 8, 19);
  c.fillRect(m.netX + width + 2, 289, 8, 19);
  c.fillStyle = '#0c172b';
  c.fillRect(0, 342, 640, 68);
  for (let track = 0; track < 3; track++) {
    const x = 20 + track * 209;
    c.fillStyle = ['#a4c7a0', '#9cbec8', '#c2a586'][track];
    c.fillRect(x, 369 - m.levels[track] * 8, 39, 30 + m.levels[track] * 8);
    c.fillStyle = '#273952';
    for (let i = 0; i < 3; i++) c.fillRect(x + 7 + i * 10, 375 - m.levels[track] * 8, 5, 7);
    c.fillStyle = '#d6dedc';
    c.font = '10px monospace';
    c.fillText(['EDUCATION', 'CARE', 'HOMES'][track], x + 48, 369);
    c.fillText(`LEVEL ${m.levels[track]}/2`, x + 48, 385);
  }
  if (m.freeze > 0) {
    c.strokeStyle = '#a0f1ee';
    c.lineWidth = 4;
    c.strokeRect(4, 96, 632, 243);
    c.lineWidth = 1;
  }
  if (m.phase === 'title' || m.phase === 'won' || m.phase === 'lost') {
    c.fillStyle = '#071120e8';
    c.fillRect(25, 136, 590, 148);
    c.textAlign = 'center';
    c.fillStyle = m.phase === 'lost' ? '#ffb4a7' : '#c2ffe3';
    c.font = 'bold 22px monospace';
    c.fillText(
      m.phase === 'title'
        ? 'BUILD THE SAFETY NET.'
        : m.phase === 'won'
          ? 'THE PUBLIC DIVIDEND!'
          : 'THE NET NEEDS REPAIRS',
      320,
      177,
    );
    c.font = '12px monospace';
    c.fillStyle = '#e4e8de';
    c.fillText(
      m.phase === 'title'
        ? 'Catch books, care, keys and coins. Let promises pass.'
        : `Community levels ${m.levels.join(' / ')} · Score ${m.score}`,
      320,
      212,
    );
    c.fillText(
      m.phase === 'title'
        ? 'Use Start above to begin.'
        : 'Restart above for another five-round campaign.',
      320,
      242,
    );
    c.textAlign = 'left';
  }
}
