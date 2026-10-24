const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

const textString = "I Love You My Sweetheart ";
const numStrings = 20;      // Number of vertical strings
const pointsPerString = 45; // Points per string

let strings = [];
let mouse = { x: -1000, y: -1000, radius: 50 };

class Point {
  constructor(x, y, pinned) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
    this.pinned = pinned; // Top point is fixed
  }

  update() {
    if (this.pinned) return;

    let vx = (this.x - this.oldX) * 1.0;
    let vy = (this.y - this.oldY) * 0.99 + 0.25;

    this.oldX = this.x;
    this.oldY = this.y;

    this.x += vx;
    this.y += vy;

    // Mouse interaction (elastic pull)
    let dx = this.x - mouse.x;
    let dy = this.y - mouse.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < mouse.radius) {
      let force = (mouse.radius - dist) / mouse.radius;
      let angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * force * 18;
      this.y += Math.sin(angle) * force * 18;
    }
  }
}

class Stick {
  constructor(p1, p2, length) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length;
  }

  resolve() {
    let dx = this.p2.x - this.p1.x;
    let dy = this.p2.y - this.p1.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    let diff = (this.length - dist) / dist;

    let offsetX = dx * diff * 0.5;
    let offsetY = dy * diff * 0.5;

    if (!this.p1.pinned) {
      this.p1.x -= offsetX;
      this.p1.y -= offsetY;
    }
    if (!this.p2.pinned) {
      this.p2.x += offsetX;
      this.p2.y += offsetY;
    }
  }
}

class StringLine {
  constructor(startX, startY, length, numPoints) {
    this.points = [];
    this.sticks = [];

    let spacing = length / numPoints;

    for (let i = 0; i < numPoints; i++) {
      let p = new Point(startX, startY + i * spacing, i === 0);
      this.points.push(p);

      if (i > 0) {
        this.sticks.push(new Stick(this.points[i - 1], p, spacing));
      }
    }
  }

  update() {
    for (let p of this.points) {
      p.update();
    }
    // Keep the string segments connected while they spring back toward their home positions.
    for (let j = 0; j < 8; j++) {
      for (let s of this.sticks) {
        s.resolve();
      }
    }
  }

  draw(stringChars, offsetIndex) {
    for (let i = 0; i < this.points.length; i++) {
      let p = this.points[i];
      let char = stringChars[(i + offsetIndex) % stringChars.length];

      ctx.save();
      ctx.translate(p.x, p.y);

      // Slight angle calculation following the string line without flipping the text
      if (i > 0) {
        let prev = this.points[i - 1];
        let angle = Math.atan2(p.x - prev.x, p.y - prev.y);
        ctx.rotate(-angle * 0.5); // Slight tilt along curve
      }

      ctx.fillStyle = '#8b0000';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }
}

function init() {
  strings = [];
  let offsetX = (width - 420) / 2;
  let offsetY = (height - 550) / 2;
  let startX = offsetX + 50;
  let endX = offsetX + 370;
  let spacingX = (endX - startX) / (numStrings - 1);

  for (let i = 0; i < numStrings; i++) {
    let x = startX + i * spacingX;
    strings.push(new StringLine(x, offsetY + 40, 440, pointsPerString));
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < strings.length; i++) {
    strings[i].update();
    strings[i].draw(textString, i * 2);
  }

  requestAnimationFrame(animate);
}

function updatePointerPosition(e) {
  let rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
}

function clearPointerPosition() {
  mouse.x = -1000;
  mouse.y = -1000;
}

canvas.addEventListener('pointerdown', updatePointerPosition);
canvas.addEventListener('pointermove', updatePointerPosition);
canvas.addEventListener('pointerup', clearPointerPosition);
canvas.addEventListener('pointercancel', clearPointerPosition);
canvas.addEventListener('pointerleave', clearPointerPosition);

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  init();
});

init();
animate();