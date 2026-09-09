/** Game-local, shaded food prop; pickup radius remains defined by the model. */
export function drawBurger(c: CanvasRenderingContext2D, x: number, y: number) {
  c.save();
  c.translate(x, y);
  const layer = (top: number, height: number, a: string, b: string) => {
    const g = c.createLinearGradient(-15, top, 15, top + height);
    g.addColorStop(0, a);
    g.addColorStop(0.6, b);
    g.addColorStop(1, '#51301c');
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(-16, top, 32, height, height * 0.4);
    c.fill();
  };
  layer(7, 7, '#e1a458', '#a55f28');
  layer(3, 6, '#653929', '#321e18');
  c.fillStyle = '#dba835';
  c.beginPath();
  c.moveTo(-16, 2);
  c.lineTo(15, 2);
  c.lineTo(10, 7);
  c.lineTo(3, 5);
  c.lineTo(-8, 8);
  c.closePath();
  c.fill();
  layer(-1, 4, '#ad4c34', '#7d3025');
  c.strokeStyle = '#76803b';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-16, -1);
  for (let i = 0; i < 8; i++) c.quadraticCurveTo(-14 + i * 4, -5 + (i % 2), -12 + i * 4, -1);
  c.stroke();
  const bun = c.createRadialGradient(5, -10, 1, 0, -4, 20);
  bun.addColorStop(0, '#f0cd83');
  bun.addColorStop(0.5, '#cf9347');
  bun.addColorStop(1, '#784823');
  c.fillStyle = bun;
  c.beginPath();
  c.moveTo(-16, -3);
  c.bezierCurveTo(-16, -18, 16, -18, 16, -3);
  c.quadraticCurveTo(1, 0, -16, -3);
  c.fill();
  for (let i = 0; i < 14; i++) {
    const px = -11 + ((i * 17) % 24),
      py = -4 - ((i * 7) % 9);
    c.fillStyle = i % 3 ? '#e8d7a0' : '#bda36a';
    c.beginPath();
    c.ellipse(px, py, 1, 0.4, (i % 4) * 0.7, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = 'rgba(71,40,22,.35)';
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(-13, 10);
  c.quadraticCurveTo(0, 13, 13, 10);
  c.stroke();
  c.restore();
}
