import { prefersReducedMotion } from '../../core/dom';

const PARTICLE_COUNT = 160;
const GRAVITY = 0.22;
const DRAG = 0.985;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  color: string;
  shape: 'web' | 'strip' | 'dot';
}

function themeColors(): string[] {
  const styles = getComputedStyle(document.documentElement);
  return ['--confetti-1', '--confetti-2', '--confetti-3', '--confetti-4']
    .map((token) => styles.getPropertyValue(token).trim())
    .filter(Boolean);
}

function drawWebGlyph(context: CanvasRenderingContext2D, size: number): void {
  context.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i;
    context.moveTo(0, 0);
    context.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
  }
  context.moveTo(size * 0.55, 0);
  context.arc(0, 0, size * 0.55, 0, Math.PI * 2);
  context.stroke();
}

export function burstConfetti(origin: { x: number; y: number }): void {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) {
    canvas.remove();
    return;
  }

  const colors = themeColors();
  const shapes: Particle['shape'][] = ['web', 'strip', 'dot'];
  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const speed = 7 + Math.random() * 11;
    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      size: 5 + Math.random() * 8,
      color: colors[i % colors.length] ?? '#ffffff',
      shape: shapes[i % shapes.length]!,
    };
  });

  function frame(): void {
    context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    context!.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = 0;
    particles.forEach((p) => {
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      if (p.y > window.innerHeight + 40) return;
      alive += 1;
      context!.save();
      context!.translate(p.x, p.y);
      context!.rotate(p.rotation);
      context!.fillStyle = p.color;
      context!.strokeStyle = p.color;
      context!.lineWidth = 1.4;
      if (p.shape === 'web') drawWebGlyph(context!, p.size);
      else if (p.shape === 'strip') context!.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
      else {
        context!.beginPath();
        context!.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        context!.fill();
      }
      context!.restore();
    });
    if (alive > 0) requestAnimationFrame(frame);
    else canvas.remove();
  }

  requestAnimationFrame(frame);
}
