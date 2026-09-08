import { destinations, type SupplyModel } from './model';
import type { SupplyConfig } from './config';
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
export function render(
  c: CanvasRenderingContext2D,
  m: SupplyModel,
  config: SupplyConfig,
  lane: number,
) {
  c.fillStyle = '#122038';
  c.fillRect(0, 0, 640, 390);
  c.fillStyle = '#23364a';
  c.fillRect(0, 88, 640, 302);
  for (let i = 0; i < 3; i++) portrait(c, i, 20 + i * 113, 7);
  c.fillStyle = '#dbdfc1';
  c.font = 'bold 15px monospace';
  c.fillText('SUPPLY THE PEOPLE', 371, 26);
  c.font = '11px monospace';
  c.fillStyle = '#a8d4cf';
  c.fillText(`SHIFT ${m.shift}/${m.endless ? '∞' : '3'} · BUDGET ${m.budget}`, 371, 45);
  c.fillText(`SCORE ${m.score} · BELL ${m.bells}`, 371, 63);
  for (let row = 0; row < 3; row++) {
    const y = 109 + row * 79;
    c.fillStyle = row === lane ? '#607689' : '#455567';
    c.fillRect(14, y, 501, 56);
    c.fillStyle = '#1b283d';
    c.fillRect(16, y + 6, 497, 44);
    c.strokeStyle = '#536979';
    for (let x = 18; x < 510; x += 25) {
      c.beginPath();
      c.moveTo(x, y + 7);
      c.lineTo(x, y + 49);
      c.stroke();
    }
    c.fillStyle = ['#d4ebad', '#edabbc', '#9ee3db'][m.gates[row]];
    c.fillRect(523, y, 106, 56);
    c.fillStyle = '#18263a';
    c.font = 'bold 11px monospace';
    c.fillText(destinations[m.gates[row]], 529, y + 22);
    c.font = '10px monospace';
    c.fillText(`LANE ${row + 1} ↻`, 532, y + 42);
    if (m.event?.lane === row) {
      c.strokeStyle = m.event.activated ? '#ff986e' : '#ffe496';
      c.lineWidth = 3;
      c.strokeRect(16, y, 499, 56);
      c.lineWidth = 1;
    }
  }
  for (const crate of m.crates) {
    const y = 119 + crate.lane * 79;
    c.fillStyle = config.variant === 'market' ? '#a87085' : '#b28252';
    c.fillRect(crate.x - 17, y, 34, 35);
    c.strokeStyle = '#efd399';
    c.strokeRect(crate.x - 17, y, 34, 35);
    c.fillStyle = '#f5efcf';
    c.font = 'bold 20px monospace';
    c.textAlign = 'center';
    c.fillText(['△', '+', '○'][crate.destination], crate.x, y + 25);
    c.textAlign = 'left';
    if (crate.sleeve) {
      c.fillStyle = '#f4c95d';
      c.fillRect(crate.x - 22, y - 8, 44, 13);
      c.fillStyle = '#4b2e32';
      c.font = 'bold 8px monospace';
      c.fillText('TRUMP +8', crate.x - 21, y + 2);
    }
  }
  c.fillStyle = '#101a2f';
  c.fillRect(0, 344, 640, 46);
  c.fillStyle = '#b9d9d0';
  c.font = '11px monospace';
  c.fillText(
    `SCHOOL ${m.delivered[0]}/8   CLINIC ${m.delivered[1]}/8   PANTRY ${m.delivered[2]}/8`,
    18,
    362,
  );
  c.fillStyle = '#8fa8bf';
  c.fillText(
    `TOTAL ${m.delivered.reduce((a, b) => a + b, 0)}/36  ·  RECOVERY ${m.recovery.length}/${m.capacity}`,
    18,
    379,
  );
  if (m.event) {
    const name = ['TRUMP: BRANDING', 'VANCE: VIP DIVERSION', 'JOHNSON: FREEZE'][m.event.person];
    c.fillStyle = '#382d40';
    c.fillRect(347, 72, 285, 21);
    c.fillStyle = '#ffe09e';
    c.font = '10px monospace';
    c.fillText(`${name}${m.event.blocked ? ' BLOCKED' : !m.event.activated ? ' …' : ''}`, 354, 86);
  }
  if (m.phase === 'title' || m.phase === 'won' || m.phase === 'lost') {
    c.fillStyle = '#071120d9';
    c.fillRect(22, 130, 596, 162);
    c.fillStyle = m.phase === 'lost' ? '#ffb4a7' : '#b6ffe5';
    c.textAlign = 'center';
    c.font = 'bold 25px monospace';
    c.fillText(
      m.phase === 'title'
        ? 'EVERYBODY EATS.'
        : m.phase === 'won'
          ? 'NEIGHBORHOOD STOCKED!'
          : 'TRY ANOTHER SHIFT',
      320,
      175,
    );
    c.fillStyle = '#edf1e5';
    c.font = '13px monospace';
    c.fillText(
      m.phase === 'title'
        ? 'Strip gold sleeves. Match △ + ○ gates.'
        : `Delivered ${m.delivered.reduce((a, b) => a + b, 0)} · Score ${m.score}`,
      320,
      211,
    );
    c.fillText(
      m.phase === 'title'
        ? 'Use Start above to open the cooperative.'
        : 'Restart above to begin a new campaign.',
      320,
      241,
    );
    c.textAlign = 'left';
  }
}
