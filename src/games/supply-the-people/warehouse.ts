import { materialNames, operatorNames, type SupplyModel } from './model';
import { LANE_Y } from './layout';
const colors = ['#78968a', '#a58669', '#7b91ae'];
function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, size = 11) {
  c.font = `bold ${size}px sans-serif`;
  c.fillStyle = '#f4ead1';
  c.textAlign = 'center';
  c.fillText(s, x, y);
}
function box(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function cargo(c: CanvasRenderingContext2D, x: number, y: number, d: number, gold: boolean) {
  c.save();
  c.translate(x, y);
  box(c, -13, -18, 26, 23, gold ? '#ba912d' : '#ba9261');
  box(c, -11, -16, 22, 3, '#e4c08a');
  box(c, -2, -18, 4, 23, '#765b3c');
  c.strokeStyle = '#483c2d';
  c.strokeRect(-13, -18, 26, 23);
  text(c, ['△', '⌂', '+'][d], 0, -2, 15);
  c.restore();
}
function worker(
  c: CanvasRenderingContext2D,
  id: number,
  x: number,
  y: number,
  facing: number,
  walk: number,
  talk: number,
  carrying: boolean,
  d: number,
  gold: boolean,
) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#06171d66';
  c.beginPath();
  c.ellipse(0, 4, 19, 5, 0, 0, Math.PI * 2);
  c.fill();
  c.lineCap = 'round';
  c.lineWidth = 7;
  c.strokeStyle = '#26323e';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 5, -19);
    c.lineTo(side * 6 + walk * side * 5, -7);
    c.lineTo(side * 7 - walk * side * 4, 1);
    c.stroke();
    box(c, side * 7 - walk * side * 4 - 4, 0, 10, 4, '#151e27');
  }
  const suit = c.createLinearGradient(-12, 0, 12, 0);
  suit.addColorStop(0, '#253a4b');
  suit.addColorStop(0.5, colors[id]);
  suit.addColorStop(1, '#20323c');
  c.fillStyle = suit;
  c.beginPath();
  c.moveTo(-10, -44);
  c.lineTo(10, -44);
  c.lineTo(13, -18);
  c.lineTo(-12, -18);
  c.closePath();
  c.fill();
  if (facing !== 2) {
    box(c, -3, -43, 6, 18, '#e8e1cb');
    box(c, -1, -39, 3, 14, ['#813e3a', '#365658', '#866b34'][id]);
  }
  c.strokeStyle = colors[id];
  c.lineWidth = 6;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 10, -41);
    c.lineTo(side * 15, -29 + walk * side * 4);
    c.lineTo(carrying ? side * 8 : side * 14, carrying ? -24 : -20 - walk * side * 4);
    c.stroke();
    c.fillStyle = ['#bc8d6a', '#dda782', '#805943'][id];
    c.beginPath();
    c.arc(
      carrying ? side * 8 : side * 14,
      carrying ? -24 : -20 - walk * side * 4,
      3,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  c.save();
  c.translate(0, -54);
  c.scale(facing === 1 ? 0.72 : 1, 1);
  const skin = c.createRadialGradient(-4, -4, 1, 0, 0, 13);
  skin.addColorStop(0, ['#dfb091', '#f0c7aa', '#b38361'][id]);
  skin.addColorStop(1, ['#946247', '#b17c5c', '#694736'][id]);
  c.fillStyle = skin;
  c.beginPath();
  c.ellipse(0, 0, 10, 13, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = ['#3a2923', '#64605a', '#252523'][id];
  c.beginPath();
  c.ellipse(0, -6, 10, 8, 0, Math.PI, Math.PI * 2);
  c.fill();
  if (facing === 2) {
    c.beginPath();
    c.ellipse(0, -1, 10, 12, 0, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = '#18252a';
    for (const eye of facing === 1 ? [4] : [-4, 4]) c.fillRect(eye, -2, 2, 2);
    c.strokeStyle = '#835e49';
    c.beginPath();
    c.moveTo(1, -1);
    c.lineTo(3, 4);
    c.lineTo(0, 4);
    c.stroke();
    c.fillStyle = '#57392e';
    c.beginPath();
    c.ellipse(0, 8, 3, 1 + talk * 3, 0, 0, Math.PI * 2);
    c.fill();
    if (id === 1) {
      c.strokeStyle = '#293940';
      c.strokeRect(-7, -4, 6, 5);
      c.strokeRect(2, -4, 6, 5);
    }
  }
  c.restore();
  if (carrying) cargo(c, 0, -21, d, gold);
  c.restore();
}
export function drawLoadingFloor(
  c: CanvasRenderingContext2D,
  m: SupplyModel,
  reducedMotion: boolean,
) {
  c.save();
  const names = [
    ['Pill & Parcel', 'PHARMACY △'],
    ['Roof & Beam', 'HOUSING ⌂'],
    ['Care Package Medical', 'MEDICAL +'],
    ['Financial', 'Misappropriations'],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * 158;
    box(c, x, 57, 150, 126, '#172e39');
    box(c, x + 3, 60, 144, 92, i === 3 ? '#a17c24' : '#647e85');
    box(c, x + 8, 65, 134, 4, i === 3 ? '#efd67e' : '#b4c3c2');
    text(c, names[i][0], x + 75, 86, i === 2 ? 11 : 12);
    text(c, names[i][1], x + 75, 103, 11);
    box(c, x + 14, 111, 122, 44, '#1d272b');
    for (let j = 0; j < 3; j++) cargo(c, x + 38 + j * 36, 145, i === 3 ? j : i, i === 3);
    box(c, x + 7, 156, 136, 9, '#768588');
    for (const tx of [x + 20, x + 117]) {
      c.fillStyle = '#10191e';
      c.beginPath();
      c.arc(tx, 171, 10, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#849092';
      c.beginPath();
      c.arc(tx, 171, 4, 0, Math.PI * 2);
      c.fill();
    }
    text(c, 'UNLOAD', x + 75, 180, 9);
  }
  // Painted transfer paths terminate at each lane's real spawn point.
  for (let lane = 0; lane < 3; lane++) {
    c.strokeStyle = colors[lane] + '66';
    c.setLineDash([4, 5]);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(83 + lane * 158, 213);
    c.lineTo(28 + lane * 13, 251);
    c.lineTo(28 + lane * 13, LANE_Y[lane] - 33);
    c.lineTo(24, LANE_Y[lane] - 28);
    c.stroke();
    c.setLineDash([]);
  }
  for (let lane = 0; lane < 3; lane++) {
    const job = m.loadingJobs.find((j) => j.lane === lane);
    const home = { x: 42, y: LANE_Y[lane] - 28 };
    let x = home.x,
      y = home.y,
      face = 0,
      walk = 0,
      talk = 0,
      carry = false;
    let d = job?.destination ?? lane;
    const p = job ? Math.min(1, job.elapsed / job.duration) : 0;
    const truck = { x: 83 + (job?.truck ?? lane) * 158, y: 213 };
    const belt = home;
    if (job) {
      if (job.phase === 'announce') {
        talk = reducedMotion ? 0 : (Math.sin(m.elapsed * 25) + 1) / 2;
      } else if (job.phase === 'walk-to-truck') {
        x = home.x + (truck.x - home.x) * p;
        y = home.y + (truck.y - home.y) * p;
        face = 2;
        walk = reducedMotion ? 0 : Math.sin(p * Math.PI * 6);
      } else if (job.phase === 'retrieve') {
        x = truck.x;
        y = truck.y;
        face = 2;
        carry = p > 0.45;
      } else if (job.phase === 'walk-to-belt') {
        x = truck.x + (belt.x - truck.x) * p;
        y = truck.y + (belt.y - truck.y) * p;
        face = 1;
        carry = true;
        walk = reducedMotion ? 0 : Math.sin(p * Math.PI * 8);
      } else {
        x = belt.x;
        y = belt.y;
        face = 1;
        carry = false;
        cargo(
          c,
          belt.x + (24 - belt.x) * p,
          belt.y - 21 + (LANE_Y[lane] + 3 - (belt.y - 21)) * p,
          d,
          job.sleeve,
        );
      }
    }
    worker(c, lane, x, y, face, walk, talk, carry, d, job?.sleeve ?? false);
    text(c, operatorNames[lane], home.x + 66, home.y - 8, 12);
    if (job?.phase === 'announce' || job?.phase === 'walk-to-truck') {
      box(c, home.x + 88, home.y - 63, 160, 27, '#f0e6ca');
      c.fillStyle = '#182e37';
      c.font = 'bold 9px sans-serif';
      c.textAlign = 'center';
      c.fillText(`${materialNames[d]} → belt ${lane + 1}`, home.x + 168, home.y - 46);
    }
  }
  c.restore();
}
