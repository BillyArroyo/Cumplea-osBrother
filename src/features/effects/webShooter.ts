import { prefersReducedMotion } from '../../core/dom';
import { buildWeb, sagPath, type Point } from './webGeometry';

const SHOT_DURATION_MS = 260;
const LIFETIME_MS = 1600;
const INTERACTIVE_SELECTOR = 'a, button, input, textarea, label, select, [contenteditable="true"], .carousel, .lightbox';

interface Shot {
  readonly from: Point;
  readonly to: Point;
  readonly startedAt: number;
  readonly splat: Path2D;
}

export function mountWebShooter(): void {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'web-shooter';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) return;

  const shots: Shot[] = [];
  let frameId: number | null = null;
  let ratio = 1;

  function resize(): void {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
  }

  function strokeColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--web-strand').trim() || '#ffffff';
  }

  function draw(now: number): void {
    context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    context!.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context!.strokeStyle = strokeColor();
    context!.lineCap = 'round';

    for (let i = shots.length - 1; i >= 0; i -= 1) {
      const shot = shots[i]!;
      const age = now - shot.startedAt;
      if (age > LIFETIME_MS) {
        shots.splice(i, 1);
        continue;
      }
      const travel = Math.min(1, age / SHOT_DURATION_MS);
      const fade = age < LIFETIME_MS * 0.6 ? 1 : 1 - (age - LIFETIME_MS * 0.6) / (LIFETIME_MS * 0.4);
      const tip = { x: shot.from.x + (shot.to.x - shot.from.x) * travel, y: shot.from.y + (shot.to.y - shot.from.y) * travel };
      context!.globalAlpha = fade;
      context!.lineWidth = 2.2;
      context!.beginPath();
      context!.moveTo(shot.from.x, shot.from.y);
      context!.quadraticCurveTo((shot.from.x + tip.x) / 2, (shot.from.y + tip.y) / 2 + 30 * (1 - travel), tip.x, tip.y);
      context!.stroke();
      if (travel === 1) {
        const grow = Math.min(1, (age - SHOT_DURATION_MS) / 140);
        context!.save();
        context!.translate(shot.to.x, shot.to.y);
        context!.scale(grow, grow);
        context!.lineWidth = 1.4 / Math.max(grow, 0.1);
        context!.stroke(shot.splat);
        context!.restore();
      }
    }
    context!.globalAlpha = 1;
    frameId = shots.length > 0 ? requestAnimationFrame(draw) : null;
  }

  function shoot(target: Point): void {
    const fromLeft = target.x > window.innerWidth / 2;
    const from = { x: fromLeft ? -10 : window.innerWidth + 10, y: window.innerHeight + 10 };
    const web = buildWeb({ x: 0, y: 0 }, 34 + Math.random() * 14, 9, 4, Math.random() * Math.PI);
    const splat = new Path2D(
      [...web.spokes.map(([a, b]) => `M${a.x} ${a.y} L${b.x} ${b.y}`), ...web.rings.map((ring) => sagPath(ring, { x: 0, y: 0 }, 0.15))].join(' '),
    );
    shots.push({ from, to: target, startedAt: performance.now(), splat });
    frameId ??= requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || event.target.closest(INTERACTIVE_SELECTOR)) return;
    shoot({ x: event.clientX, y: event.clientY });
  });
}
